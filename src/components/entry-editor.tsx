"use client";

import { useRef, useState, useTransition } from "react";
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
interface ImageItem { url: string; size: ImageSize; }

const SIZE_LABELS: Record<ImageSize, string> = { sm: "S", md: "M", lg: "L" };
const SIZE_WIDTHS: Record<ImageSize, string> = {
  sm: "30%",
  md: "48%",
  lg: "100%",
};

interface EntryEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialMood?: string | null;
  initialImages?: Array<{ url: string; size: string }>;
  date: string;
}

export function EntryEditor({
  id,
  initialTitle = "",
  initialContent = "",
  initialMood,
  initialImages = [],
  date,
}: EntryEditorProps) {
  const [mood, setMood] = useState(initialMood ?? "");
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<ImageItem[]>(
    initialImages.map((img) => ({ url: img.url, size: (img.size as ImageSize) || "lg" }))
  );
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    const newItems: ImageItem[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("entry-images").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("entry-images").getPublicUrl(path);
        newItems.push({ url: publicUrl, size: "lg" });
      }
    }

    setImages((prev) => [...prev, ...newItems]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function openCrop(index: number) {
    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    setCropIndex(index);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function setSize(index: number, size: ImageSize) {
    setImages((prev) => prev.map((img, i) => i === index ? { ...img, size } : img));
  }

  function handleDragStart(index: number) { setDraggingIndex(index); }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }
  function handleDrop(index: number) {
    if (draggingIndex === null || draggingIndex === index) return;
    const next = [...images];
    const [moved] = next.splice(draggingIndex, 1);
    next.splice(index, 0, moved);
    setImages(next);
    setDraggingIndex(null);
    setDragOverIndex(null);
  }
  function handleDragEnd() {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function handleSave(formData: FormData) {
    formData.set("mood", mood);
    formData.set("content", content);
    formData.set("images", JSON.stringify(images));
    startTransition(async () => {
      await saveEntry(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <>
      {cropIndex !== null && (
        <ImageCropModal
          url={images[cropIndex].url}
          userId={userId}
          onDone={(newUrl) => {
            setImages((prev) =>
              prev.map((img, i) => i === cropIndex ? { ...img, url: newUrl } : img)
            );
            setCropIndex(null);
          }}
          onCancel={() => setCropIndex(null)}
        />
      )}

      <form action={handleSave} className="flex flex-col">
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="date" value={date} />

        <div className="px-10 pt-10 pb-6 flex flex-col gap-5">

          {/* Title */}
          <Input
            name="title"
            defaultValue={initialTitle}
            placeholder="Entry title..."
            className="font-serif text-2xl font-semibold border-0 border-b border-gray-200 rounded-none px-0 py-2 text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 bg-transparent h-auto"
          />

          {/* Mood */}
          <div className="flex flex-wrap gap-2">
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

          {/* Content */}
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today..."
            className="journal-prose w-full min-h-[320px] bg-transparent border-0 outline-none resize-none placeholder:text-gray-300 text-gray-800 leading-[1.9]"
            autoFocus={!initialContent}
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.05rem" }}
          />

          {/* Photos */}
          {images.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-3">
                {images.map((img, i) => (
                  <div
                    key={img.url}
                    style={{ width: SIZE_WIDTHS[img.size] }}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-grab active:cursor-grabbing transition-all duration-150 ${
                      draggingIndex === i ? "opacity-40 scale-95" : ""
                    } ${
                      dragOverIndex === i && draggingIndex !== i
                        ? "ring-2 ring-amber-400 ring-offset-2 rounded-xl"
                        : ""
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full object-cover rounded-xl shadow-sm pointer-events-none"
                      style={{ aspectRatio: img.size === "lg" ? "16/9" : "1/1" }}
                    />

                    {/* Top controls */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-black/40 text-white rounded flex items-center justify-center text-xs select-none">⠿</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    >
                      ×
                    </button>

                    {/* Bottom controls */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Size toggle */}
                      <div className="flex gap-1">
                        {(["sm", "md", "lg"] as ImageSize[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSize(i, s)}
                            className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                              img.size === s
                                ? "bg-white text-gray-900"
                                : "bg-black/40 text-white hover:bg-black/60"
                            }`}
                          >
                            {SIZE_LABELS[s]}
                          </button>
                        ))}
                      </div>

                      {/* Crop button */}
                      <button
                        type="button"
                        onClick={() => openCrop(i)}
                        className="px-2 h-6 rounded bg-black/40 text-white text-[10px] font-medium hover:bg-black/60 transition-colors"
                      >
                        Crop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <p className="text-[11px] text-gray-400 mt-2">Drag to reorder</p>
              )}
            </div>
          )}

          {/* Add photo */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <span className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-sm leading-none">
                ◎
              </span>
              {uploading ? "Uploading..." : "Add photos"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-10 py-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">≈ {pageCount} {pageCount === 1 ? "page" : "pages"}</span>
            {saved && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-green-500">Saved ✓</span></>}
          </div>
          <Button type="submit" disabled={isPending || uploading} className="rounded-full px-6 bg-gray-900 hover:bg-gray-700 text-white text-sm">
            {isPending ? "Saving..." : "Save entry"}
          </Button>
        </div>
      </form>
    </>
  );
}
