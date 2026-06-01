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
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    startTransition(async () => {
      await saveEntry(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form action={handleSave} className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="date" value={date} />
      {images.map((url, i) => (
        <input key={i} type="hidden" name="images" value={url} />
      ))}

      {/* Title */}
      <Input
        name="title"
        defaultValue={initialTitle}
        placeholder="Give this entry a title..."
        className="font-serif text-2xl font-semibold border-0 border-b border-border rounded-none px-0 py-2 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-accent bg-transparent h-auto"
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
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border text-muted-foreground hover:border-accent/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <textarea
        name="content"
        defaultValue={initialContent}
        placeholder="What's on your mind today..."
        className="journal-prose w-full min-h-[320px] bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/40 text-foreground"
        autoFocus={!initialContent}
      />

      {/* Photos */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-xl shadow-sm"
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
          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <span className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-base leading-none">
            ◎
          </span>
          {uploading ? "Uploading..." : "Add photos"}
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          {saved ? "Saved ✓" : isPending ? "Saving..." : "Unsaved changes"}
        </span>
        <Button type="submit" disabled={isPending || uploading} className="rounded-full px-6">
          Save entry
        </Button>
      </div>
    </form>
  );
}
