"use client";

import { useRef, useState, useTransition } from "react";
import { saveEntry } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
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

interface EntryEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialMood?: string | null;
  initialImages?: string[];
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
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / WORDS_PER_PAGE));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("entry-images")
        .upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("entry-images")
          .getPublicUrl(path);
        urls.push(publicUrl);
      }
    }

    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave(formData: FormData) {
    formData.set("mood", mood);
    formData.set("content", content);
    startTransition(async () => {
      await saveEntry(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form action={handleSave} className="flex flex-col">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="date" value={date} />
      {images.map((url, i) => (
        <input key={i} type="hidden" name="images" value={url} />
      ))}

      {/* Page content area */}
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

        {/* Content — auto-grow textarea */}
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today..."
          className="journal-prose w-full min-h-[380px] bg-transparent border-0 outline-none resize-none placeholder:text-gray-300 text-gray-800 leading-[1.9]"
          autoFocus={!initialContent}
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.05rem" }}
        />

        {/* Photos */}
        {images.length > 0 && (
          <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {images.map((url, i) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt=""
                  className={`w-full object-cover rounded-lg shadow-sm ${images.length === 1 ? "aspect-video" : "aspect-square"}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >
                  ×
                </button>
              </div>
            ))}
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

      {/* Page footer */}
      <div className="flex items-center justify-between px-10 py-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            ≈ {pageCount} {pageCount === 1 ? "page" : "pages"}
          </span>
          {saved && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-green-500">Saved ✓</span>
            </>
          )}
        </div>
        <Button
          type="submit"
          disabled={isPending || uploading}
          className="rounded-full px-6 bg-gray-900 hover:bg-gray-700 text-white text-sm"
        >
          {isPending ? "Saving..." : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
