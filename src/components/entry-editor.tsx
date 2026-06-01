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

type TextBlock  = { id: string; type: "text";  content: string };
type ImageBlock = { id: string; type: "image"; url: string; width: number }; // width = 20–100 (%)
type Block = TextBlock | ImageBlock;

function uid() { return Math.random().toString(36).slice(2); }

function sizeToWidth(size: string): number {
  if (size === "sm") return 33;
  if (size === "md") return 50;
  return 100;
}

function snap(pct: number): number {
  const close = SNAP_POINTS.find((s) => Math.abs(s - pct) <= 3);
  return close ?? pct;
}

function initBlocks(
  content: string,
  images: Array<{ url: string; size?: string; width?: number }>,
  rawBlocks: unknown
): Block[] {
  const arr = Array.isArray(rawBlocks) ? rawBlocks : [];
  if (arr.length > 0) {
    return (arr as Array<Record<string, unknown>>).map((b) => {
      if (b.type === "image") {
        return {
          id: (b.id as string) || uid(),
          type: "image" as const,
          url: b.url as string,
          width: (b.width as number) ?? sizeToWidth((b.size as string) ?? "lg"),
        };
      }
      return { id: (b.id as string) || uid(), type: "text" as const, content: (b.content as string) || "" };
    });
  }
  const blocks: Block[] = [];
  if (content) blocks.push({ id: uid(), type: "text", content });
  for (const img of images) {
    blocks.push({ id: uid(), type: "image", url: img.url, width: img.width ?? sizeToWidth(img.size ?? "lg") });
  }
  if (blocks.length === 0) blocks.push({ id: uid(), type: "text", content: "" });
  return blocks;
}

function AutoTextarea({ value, onChange, autoFocus, placeholder }: {
  value: string; onChange: (v: string) => void; autoFocus?: boolean; placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus={autoFocus}
      placeholder={placeholder}
      rows={1}
      className="w-full bg-transparent border-0 outline-none resize-none placeholder:text-gray-300 text-gray-800 leading-[1.9] overflow-hidden"
      style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.05rem", minHeight: "2em" }}
    />
  );
}

interface EntryEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialMood?: string | null;
  initialImages?: Array<{ url: string; size?: string; width?: number }>;
  initialBlocks?: unknown;
  date: string;
}

export function EntryEditor({
  id, initialTitle = "", initialContent = "", initialMood,
  initialImages = [], initialBlocks, date,
}: EntryEditorProps) {
  const [mood, setMood] = useState(initialMood ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() =>
    initBlocks(initialContent, initialImages, initialBlocks)
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [cropBlockId, setCropBlockId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const wordCount = blocks
    .filter((b): b is TextBlock => b.type === "text")
    .reduce((n, b) => n + (b.content.trim() ? b.content.trim().split(/\s+/).length : 0), 0);
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));

  function updateText(id: string, content: string) {
    setBlocks((prev) => prev.map((b) => b.id === id && b.type === "text" ? { ...b, content } : b));
  }

  function setImageWidth(id: string, width: number) {
    setBlocks((prev) => prev.map((b) => b.id === id && b.type === "image" ? { ...b, width } : b));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length === 0 ? [{ id: uid(), type: "text", content: "" }] : next;
    });
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function startResize(e: React.MouseEvent, blockId: string) {
    e.preventDefault();
    e.stopPropagation();
    const el = blockRefs.current.get(blockId);
    if (!el) return;
    const parentWidth = el.parentElement?.offsetWidth ?? el.offsetWidth;
    const startX = e.clientX;
    const startPx = el.offsetWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const raw = Math.round(Math.max(20, Math.min(100, (startPx + delta) / parentWidth * 100)));
      setImageWidth(blockId, snap(raw));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function addImageAfter(insertAfterIndex: number, files: FileList | null) {
    if (!files || files.length === 0) return;
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
        newBlocks.push({ id: uid(), type: "image", url: publicUrl, width: 100 });
      }
    }
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(insertAfterIndex + 1, 0, ...newBlocks);
      return next;
    });
    setUploading(null);
  }

  function handleSave(formData: FormData) {
    formData.set("mood", mood);
    formData.set("blocks", JSON.stringify(blocks));
    startTransition(async () => {
      await saveEntry(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const cropBlock = blocks.find((b) => b.id === cropBlockId) as ImageBlock | undefined;

  return (
    <>
      {cropBlock && (
        <ImageCropModal
          url={cropBlock.url}
          userId={userId}
          onDone={(newUrl) => {
            setBlocks((prev) => prev.map((b) => b.id === cropBlockId ? { ...b, url: newUrl } : b));
            setCropBlockId(null);
          }}
          onCancel={() => setCropBlockId(null)}
        />
      )}

      <form action={handleSave} className="flex flex-col">
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="date" value={date} />

        <div className="px-10 pt-10 pb-6 flex flex-col gap-1">
          <Input
            name="title"
            defaultValue={initialTitle}
            placeholder="Entry title..."
            className="font-serif text-2xl font-semibold border-0 border-b border-gray-200 rounded-none px-0 py-2 mb-4 text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 bg-transparent h-auto"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            {MOODS.map((m) => (
              <button key={m.value} type="button"
                onClick={() => setMood(mood === m.value ? "" : m.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  mood === m.value ? "border-amber-400 bg-amber-50 text-gray-800" : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                }`}>{m.label}</button>
            ))}
          </div>

          {blocks.map((block, i) => (
            <div key={block.id}>
              {block.type === "text" ? (
                <AutoTextarea
                  value={block.content}
                  onChange={(v) => updateText(block.id, v)}
                  autoFocus={i === 0 && !initialContent}
                  placeholder={i === 0 ? "What's on your mind today..." : "Continue writing..."}
                />
              ) : (
                <div
                  ref={(el) => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id); }}
                  className="relative group my-3 select-none"
                  style={{ width: `${block.width}%` }}
                >
                  <img
                    src={block.url}
                    alt=""
                    className="w-full rounded-xl shadow-sm object-cover pointer-events-none"
                    style={{ aspectRatio: block.width >= 90 ? "16/9" : "1/1" }}
                  />

                  {/* Top controls (move + remove) */}
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => moveBlock(block.id, -1)}
                      className="w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center text-xs hover:bg-black/70">↑</button>
                    <button type="button" onClick={() => moveBlock(block.id, 1)}
                      className="w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center text-xs hover:bg-black/70">↓</button>
                  </div>
                  <button type="button" onClick={() => removeBlock(block.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">×</button>

                  {/* Crop button */}
                  <button type="button"
                    onClick={async () => {
                      if (!userId) {
                        const { data: { user } } = await createClient().auth.getUser();
                        if (user) setUserId(user.id);
                      }
                      setCropBlockId(block.id);
                    }}
                    className="absolute bottom-2 left-2 px-2 h-6 rounded bg-black/40 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
                    Crop
                  </button>

                  {/* Width label */}
                  <div className="absolute bottom-2 right-10 px-1.5 h-5 rounded bg-black/30 text-white text-[10px] flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {block.width}%
                  </div>

                  {/* Resize handle — right edge */}
                  <div
                    onMouseDown={(e) => startResize(e, block.id)}
                    className="absolute top-0 right-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-1 h-10 bg-white/80 rounded-full shadow-md" />
                  </div>
                </div>
              )}

              <InsertPoint loading={uploading === i} onFiles={(f) => addImageAfter(i, f)} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-10 py-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">≈ {pageCount} {pageCount === 1 ? "page" : "pages"}</span>
            {saved && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-green-500">Saved ✓</span></>}
          </div>
          <Button type="submit" disabled={isPending || uploading !== null}
            className="rounded-full px-6 bg-gray-900 hover:bg-gray-700 text-white text-sm">
            {isPending ? "Saving..." : "Save entry"}
          </Button>
        </div>
      </form>
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
