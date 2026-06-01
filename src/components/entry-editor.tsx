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

type ImageSize = "sm" | "md" | "lg";
type TextBlock  = { id: string; type: "text";  content: string };
type ImageBlock = { id: string; type: "image"; url: string; size: ImageSize };
type Block = TextBlock | ImageBlock;

const SIZE_WIDTHS: Record<ImageSize, string> = { sm: "30%", md: "48%", lg: "100%" };

function uid() { return Math.random().toString(36).slice(2); }

function initBlocks(
  content: string,
  images: Array<{ url: string; size: string }>,
  rawBlocks: unknown
): Block[] {
  const arr = Array.isArray(rawBlocks) ? rawBlocks : [];
  if (arr.length > 0) return arr as Block[];
  const blocks: Block[] = [];
  if (content) blocks.push({ id: uid(), type: "text", content });
  for (const img of images) {
    blocks.push({ id: uid(), type: "image", url: img.url, size: (img.size as ImageSize) || "lg" });
  }
  if (blocks.length === 0) blocks.push({ id: uid(), type: "text", content: "" });
  return blocks;
}

// Auto-grow textarea
function AutoTextarea({ value, onChange, autoFocus, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
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
  initialImages?: Array<{ url: string; size: string }>;
  initialBlocks?: unknown;
  date: string;
}

export function EntryEditor({
  id,
  initialTitle = "",
  initialContent = "",
  initialMood,
  initialImages = [],
  initialBlocks,
  date,
}: EntryEditorProps) {
  const [mood, setMood] = useState(initialMood ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() =>
    initBlocks(initialContent, initialImages, initialBlocks)
  );
  const [uploading, setUploading] = useState<number | null>(null); // insert-after index
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [cropBlockId, setCropBlockId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  const wordCount = blocks
    .filter((b): b is TextBlock => b.type === "text")
    .reduce((n, b) => n + (b.content.trim() ? b.content.trim().split(/\s+/).length : 0), 0);
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));

  function updateText(id: string, content: string) {
    setBlocks((prev) => prev.map((b) => b.id === id && b.type === "text" ? { ...b, content } : b));
  }

  function setImageSize(id: string, size: ImageSize) {
    setBlocks((prev) => prev.map((b) => b.id === id && b.type === "image" ? { ...b, size } : b));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      // Always keep at least one text block
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
        newBlocks.push({ id: uid(), type: "image", url: publicUrl, size: "lg" });
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
            setBlocks((prev) =>
              prev.map((b) => b.id === cropBlockId ? { ...b, url: newUrl } : b)
            );
            setCropBlockId(null);
          }}
          onCancel={() => setCropBlockId(null)}
        />
      )}

      <form action={handleSave} className="flex flex-col">
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="date" value={date} />

        <div className="px-10 pt-10 pb-6 flex flex-col gap-1">

          {/* Title */}
          <Input
            name="title"
            defaultValue={initialTitle}
            placeholder="Entry title..."
            className="font-serif text-2xl font-semibold border-0 border-b border-gray-200 rounded-none px-0 py-2 mb-4 text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 bg-transparent h-auto"
          />

          {/* Mood */}
          <div className="flex flex-wrap gap-2 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? "" : m.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  mood === m.value
                    ? "border-amber-400 bg-amber-50 text-gray-800"
                    : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Blocks */}
          {blocks.map((block, i) => (
            <div key={block.id}>
              {/* Block content */}
              {block.type === "text" ? (
                <AutoTextarea
                  value={block.content}
                  onChange={(v) => updateText(block.id, v)}
                  autoFocus={i === 0 && !initialContent}
                  placeholder={i === 0 ? "What's on your mind today..." : "Continue writing..."}
                />
              ) : (
                <div className="relative group my-3" style={{ width: SIZE_WIDTHS[block.size] }}>
                  <img
                    src={block.url}
                    alt=""
                    className="w-full object-cover rounded-xl shadow-sm"
                    style={{ aspectRatio: block.size === "lg" ? "16/9" : "1/1" }}
                  />
                  {/* Controls overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move up/down */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <button type="button" onClick={() => moveBlock(block.id, -1)}
                        className="w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center text-xs hover:bg-black/70">↑</button>
                      <button type="button" onClick={() => moveBlock(block.id, 1)}
                        className="w-6 h-6 bg-black/50 text-white rounded flex items-center justify-center text-xs hover:bg-black/70">↓</button>
                    </div>
                    {/* Remove */}
                    <button type="button" onClick={() => removeBlock(block.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-sm leading-none hover:bg-black/80">×</button>
                    {/* Size + Crop */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        {(["sm", "md", "lg"] as ImageSize[]).map((s) => (
                          <button key={s} type="button" onClick={() => setImageSize(block.id, s)}
                            className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${block.size === s ? "bg-white text-gray-900" : "bg-black/40 text-white hover:bg-black/60"}`}>
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => { setUserId(userId); setCropBlockId(block.id); }}
                        className="px-2 h-6 rounded bg-black/40 text-white text-[10px] font-medium hover:bg-black/60">Crop</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Insert point after this block */}
              <InsertPoint
                loading={uploading === i}
                onFiles={(files) => addImageAfter(i, files)}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
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
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="absolute left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full text-[11px] text-gray-400 px-3 py-0.5 opacity-0 group-hover/ins:opacity-100 transition-opacity hover:text-gray-600 hover:border-gray-300 whitespace-nowrap shadow-sm disabled:opacity-50"
      >
        {loading ? "uploading..." : "◎ add photo here"}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
