"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { saveEntry } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { ImageCropModal } from "@/components/image-crop-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOODS = [
  { value: "happy",    label: "😊 Happy" },
  { value: "calm",     label: "😌 Calm" },
  { value: "anxious",  label: "😟 Anxious" },
  { value: "sad",      label: "😔 Sad" },
  { value: "grateful", label: "🙏 Grateful" },
  { value: "excited",  label: "✨ Excited" },
];

const WORDS_PER_PAGE = 200;
const SNAP_POINTS = [25, 33, 50, 66, 75, 100];
const MIN_HEIGHT = 60;

type Align = "full" | "left" | "right";
type TextBlock  = { id: string; type: "text";  content: string };
type ImageBlock = { id: string; type: "image"; url: string; width: number; height: number | null; align: Align };
type Block = TextBlock | ImageBlock;

const HANDLES = [
  { id: "nw", style: { top: -4, left:  -4 }, cursor: "nwse-resize", dx: -1, dy: -1 },
  { id: "n",  style: { top: -4, left: "50%", transform: "translateX(-50%)" }, cursor: "ns-resize",   dx:  0, dy: -1 },
  { id: "ne", style: { top: -4, right: -4 }, cursor: "nesw-resize", dx:  1, dy: -1 },
  { id: "e",  style: { top: "50%", right: -4, transform: "translateY(-50%)" }, cursor: "ew-resize",   dx:  1, dy:  0 },
  { id: "se", style: { bottom: -4, right: -4 }, cursor: "nwse-resize", dx:  1, dy:  1 },
  { id: "s",  style: { bottom: -4, left: "50%", transform: "translateX(-50%)" }, cursor: "ns-resize",   dx:  0, dy:  1 },
  { id: "sw", style: { bottom: -4, left:  -4 }, cursor: "nesw-resize", dx: -1, dy:  1 },
  { id: "w",  style: { top: "50%", left:  -4, transform: "translateY(-50%)" }, cursor: "ew-resize",   dx: -1, dy:  0 },
] as const;

function uid() { return Math.random().toString(36).slice(2); }
function snap(pct: number) { return SNAP_POINTS.find((s) => Math.abs(s - pct) <= 3) ?? pct; }
function sizeToWidth(size: string) { return size === "sm" ? 33 : size === "md" ? 50 : 100; }

function initBlocks(content: string, images: Array<{ url: string; size?: string; width?: number }>, rawBlocks: unknown): Block[] {
  const arr = Array.isArray(rawBlocks) ? rawBlocks : [];
  if (arr.length > 0) {
    return (arr as Array<Record<string, unknown>>).map((b) => {
      if (b.type === "image") return {
        id: (b.id as string) || uid(), type: "image" as const,
        url: b.url as string,
        width: (b.width as number) ?? sizeToWidth((b.size as string) ?? "lg"),
        height: (b.height as number | null) ?? null,
        align: ((b.align as Align) ?? "full"),
      };
      return { id: (b.id as string) || uid(), type: "text" as const, content: (b.content as string) || "" };
    });
  }
  const blocks: Block[] = [];
  if (content) blocks.push({ id: uid(), type: "text", content });
  for (const img of images) blocks.push({ id: uid(), type: "image", url: img.url, width: img.width ?? sizeToWidth(img.size ?? "lg"), height: null, align: "full" });
  if (blocks.length === 0) blocks.push({ id: uid(), type: "text", content: "" });
  return blocks;
}

function AutoTextarea({ value, onChange, autoFocus, placeholder }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
      autoFocus={autoFocus} placeholder={placeholder} rows={1}
      className="w-full bg-transparent border-0 outline-none resize-none placeholder:text-gray-300 text-gray-800 leading-[1.9] overflow-hidden"
      style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.05rem", minHeight: "2em" }} />
  );
}

interface EntryEditorProps {
  id?: string; initialTitle?: string; initialContent?: string;
  initialMood?: string | null; initialImages?: Array<{ url: string; size?: string; width?: number }>;
  initialBlocks?: unknown; date: string;
}

export function EntryEditor({ id, initialTitle = "", initialContent = "", initialMood, initialImages = [], initialBlocks, date }: EntryEditorProps) {
  const [mood, setMood] = useState(initialMood ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() => initBlocks(initialContent, initialImages, initialBlocks));
  const [uploading, setUploading] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [cropBlockId, setCropBlockId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const wordCount = blocks.filter((b): b is TextBlock => b.type === "text")
    .reduce((n, b) => n + (b.content.trim() ? b.content.trim().split(/\s+/).length : 0), 0);
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));

  function updateText(id: string, content: string) {
    setBlocks((p) => p.map((b) => b.id === id && b.type === "text" ? { ...b, content } : b));
  }
  function setImageProp(id: string, props: Partial<ImageBlock>) {
    setBlocks((p) => p.map((b) => b.id === id && b.type === "image" ? { ...b, ...props } : b));
  }
  function removeBlock(id: string) {
    setBlocks((p) => { const n = p.filter((b) => b.id !== id); return n.length === 0 ? [{ id: uid(), type: "text", content: "" }] : n; });
  }

  function startResize(e: React.MouseEvent, blockId: string, dx: number, dy: number) {
    e.preventDefault(); e.stopPropagation();
    const el = blockRefs.current.get(blockId);
    if (!el) return;
    const parentWidth = el.parentElement?.offsetWidth ?? el.offsetWidth;
    const startX = e.clientX, startY = e.clientY, startW = el.offsetWidth, startH = el.offsetHeight;
    const onMove = (ev: MouseEvent) => {
      if (dx !== 0) setImageProp(blockId, { width: snap(Math.round(Math.max(20, Math.min(100, (startW + (ev.clientX - startX) * dx) / parentWidth * 100)))) });
      if (dy !== 0) setImageProp(blockId, { height: Math.max(MIN_HEIGHT, Math.round(startH + (ev.clientY - startY) * dy)) });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleDragStart(e: React.DragEvent, blockId: string) {
    setDraggingId(blockId);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  }
  function handleDrop(targetIndex: number) {
    if (!draggingId) return;
    setBlocks((prev) => {
      const fromIndex = prev.findIndex((b) => b.id === draggingId);
      if (fromIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      const adjustedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedTarget, 0, moved);
      return next;
    });
    setDraggingId(null);
    setDropIndex(null);
  }
  function handleDragEnd() { setDraggingId(null); setDropIndex(null); }

  async function addImageAfter(insertAfterIndex: number, files: FileList | null) {
    if (!files?.length) return;
    setUploading(insertAfterIndex);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !userId) setUserId(user.id);
    const newBlocks: ImageBlock[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${Date.now()}_${uid()}.${ext}`;
      const { error } = await supabase.storage.from("entry-images").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("entry-images").getPublicUrl(path);
        newBlocks.push({ id: uid(), type: "image", url: publicUrl, width: 100, height: null, align: "full" });
      }
    }
    setBlocks((prev) => { const next = [...prev]; next.splice(insertAfterIndex + 1, 0, ...newBlocks); return next; });
    setUploading(null);
  }

  function handleSave(formData: FormData) {
    formData.set("mood", mood);
    formData.set("blocks", JSON.stringify(blocks));
    startTransition(async () => { await saveEntry(formData); setSaved(true); setTimeout(() => setSaved(false), 2000); });
  }

  const cropBlock = blocks.find((b) => b.id === cropBlockId) as ImageBlock | undefined;

  // Compute side-by-side pairs: image with align left/right + next text block
  const consumedIds = new Set<string>();
  const sidePairs = new Map<string, TextBlock>(); // imageId → textBlock
  for (let i = 0; i < blocks.length - 1; i++) {
    const b = blocks[i], next = blocks[i + 1];
    if (b.type === "image" && (b.align === "left" || b.align === "right") && next.type === "text") {
      sidePairs.set(b.id, next as TextBlock);
      consumedIds.add(next.id);
    }
  }

  function renderImageBlock(block: ImageBlock, i: number) {
    const isDragging = draggingId === block.id;
    return (
      <div
        ref={(el) => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id); }}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragEnd={handleDragEnd}
        className={`relative group my-2 select-none transition-opacity ${isDragging ? "opacity-30" : ""}`}
        style={{ width: block.align === "full" ? `${block.width}%` : `${block.width}%` }}
      >
        <img src={block.url} alt=""
          className="w-full rounded-xl shadow-sm object-cover pointer-events-none"
          style={{ height: block.height ?? undefined, aspectRatio: block.height ? undefined : (block.width >= 90 ? "16/9" : "1/1") }} />

        {/* Drag handle */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-black/40 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-xs select-none">⠿</div>

        {/* Remove */}
        <button type="button" onClick={() => removeBlock(block.id)}
          className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">×</button>

        {/* Bottom controls */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity gap-1">
          <div className="flex items-center gap-1">
            {/* Alignment */}
            {(["left", "full", "right"] as Align[]).map((a) => (
              <button key={a} type="button" onClick={() => setImageProp(block.id, { align: a })}
                className={`w-6 h-6 rounded text-[10px] transition-colors ${block.align === a ? "bg-white text-gray-900" : "bg-black/40 text-white hover:bg-black/60"}`}>
                {a === "left" ? "←" : a === "right" ? "→" : "↔"}
              </button>
            ))}
            <button type="button"
              onClick={async () => { if (!userId) { const { data: { user } } = await createClient().auth.getUser(); if (user) setUserId(user.id); } setCropBlockId(block.id); }}
              className="px-2 h-6 rounded bg-black/40 text-white text-[10px] font-medium hover:bg-black/60 ml-1">Crop</button>
          </div>
          <span className="px-1.5 h-5 rounded bg-black/30 text-white text-[10px] flex items-center shrink-0">
            {block.width}%{block.height ? ` · ${block.height}px` : ""}
          </span>
        </div>

        {/* Resize handles */}
        {HANDLES.map((h) => (
          <div key={h.id} onMouseDown={(e) => startResize(e, block.id, h.dx, h.dy)}
            className="absolute w-3 h-3 bg-white border-2 border-gray-400 rounded-sm shadow opacity-0 group-hover:opacity-100 transition-opacity hover:border-gray-700 hover:scale-125"
            style={{ ...h.style, cursor: h.cursor }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {cropBlock && (
        <ImageCropModal url={cropBlock.url} userId={userId}
          onDone={(newUrl) => { setBlocks((p) => p.map((b) => b.id === cropBlockId ? { ...b, url: newUrl } : b)); setCropBlockId(null); }}
          onCancel={() => setCropBlockId(null)} />
      )}

      <form action={handleSave} className="flex flex-col">
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="date" value={date} />

        <div className="px-10 pt-10 pb-6 flex flex-col gap-1">
          <Input name="title" defaultValue={initialTitle} placeholder="Entry title..."
            className="font-serif text-2xl font-semibold border-0 border-b border-gray-200 rounded-none px-0 py-2 mb-4 text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 bg-transparent h-auto" />

          <div className="flex flex-wrap gap-2 mb-4">
            {MOODS.map((m) => (
              <button key={m.value} type="button" onClick={() => setMood(mood === m.value ? "" : m.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${mood === m.value ? "border-amber-400 bg-amber-50 text-gray-800" : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Drop zone before first block */}
          {draggingId && (
            <DropZone active={dropIndex === 0} onDragOver={(e) => handleDragOver(e, 0)} onDrop={() => handleDrop(0)} />
          )}

          {blocks.map((block, i) => {
            if (consumedIds.has(block.id)) return null;

            const isImage = block.type === "image";
            const sidePairText = isImage ? sidePairs.get(block.id) : undefined;

            return (
              <div key={block.id}>
                {/* Side-by-side layout */}
                {isImage && sidePairText ? (
                  <div className={`flex gap-4 my-2 ${(block as ImageBlock).align === "right" ? "flex-row-reverse" : "flex-row"}`}>
                    {renderImageBlock(block as ImageBlock, i)}
                    <div className="flex-1 min-w-0">
                      <AutoTextarea value={sidePairText.content} onChange={(v) => updateText(sidePairText.id, v)} placeholder="Write beside the photo..." />
                    </div>
                  </div>
                ) : isImage ? (
                  renderImageBlock(block as ImageBlock, i)
                ) : (
                  <AutoTextarea value={(block as TextBlock).content} onChange={(v) => updateText(block.id, v)}
                    autoFocus={i === 0 && !initialContent}
                    placeholder={i === 0 ? "What's on your mind today..." : "Continue writing..."} />
                )}

                {/* Insert photo point */}
                <InsertPoint loading={uploading === i} onFiles={(f) => addImageAfter(i, f)} />

                {/* Drop zone after this block */}
                {draggingId && (
                  <DropZone active={dropIndex === i + 1} onDragOver={(e) => handleDragOver(e, i + 1)} onDrop={() => handleDrop(i + 1)} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-10 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">≈ {pageCount} {pageCount === 1 ? "page" : "pages"}</span>
            {saved && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-green-500">Saved ✓</span></>}
            <span className="text-xs text-gray-300">·</span>
            <AddPhotoButton loading={uploading === blocks.length - 1} onFiles={(f) => addImageAfter(blocks.length - 1, f)} />
          </div>
          <Button type="submit" disabled={isPending || uploading !== null} className="rounded-full px-6 bg-gray-900 hover:bg-gray-700 text-white text-sm">
            {isPending ? "Saving..." : "Save entry"}
          </Button>
        </div>
      </form>
    </>
  );
}

function DropZone({ active, onDragOver, onDrop }: { active: boolean; onDragOver: (e: React.DragEvent) => void; onDrop: () => void }) {
  return (
    <div onDragOver={onDragOver} onDrop={onDrop}
      className={`h-2 rounded-full transition-all my-0.5 ${active ? "bg-amber-300 scale-y-150" : "bg-transparent"}`} />
  );
}

function AddPhotoButton({ onFiles, loading }: { onFiles: (f: FileList | null) => void; loading: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={loading}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50">
        <span className="text-base leading-none">◎</span>
        {loading ? "uploading..." : "Add photo"}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </>
  );
}

function InsertPoint({ onFiles, loading }: { onFiles: (f: FileList | null) => void; loading: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="group/ins relative h-6 flex items-center -mx-10 px-10 my-0.5">
      <div className="w-full h-px bg-gray-100 opacity-0 group-hover/ins:opacity-100 transition-opacity" />
      <button type="button" onClick={() => ref.current?.click()} disabled={loading}
        className="absolute left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full text-[11px] text-gray-400 px-3 py-0.5 opacity-0 group-hover/ins:opacity-100 transition-opacity hover:text-gray-600 hover:border-gray-300 whitespace-nowrap shadow-sm disabled:opacity-50">
        {loading ? "uploading..." : "◎ add photo here"}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
