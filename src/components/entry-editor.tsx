"use client";

import { useRef, useState, useTransition } from "react";
import { saveEntry } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOODS = [
  { value: "happy", label: "😊 Happy" },
  { value: "calm", label: "😌 Calm" },
  { value: "anxious", label: "😟 Anxious" },
  { value: "sad", label: "😔 Sad" },
  { value: "grateful", label: "🙏 Grateful" },
  { value: "excited", label: "✨ Excited" },
];

interface EntryEditorProps {
  id?: string;
  initialTitle?: string;
  initialContent?: string;
  initialMood?: string | null;
  date: string;
}

export function EntryEditor({ id, initialTitle = "", initialContent = "", initialMood, date }: EntryEditorProps) {
  const [mood, setMood] = useState(initialMood ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSave(formData: FormData) {
    formData.set("mood", mood);
    startTransition(async () => {
      await saveEntry(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form ref={formRef} action={handleSave} className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="date" value={date} />

      {/* Title */}
      <Input
        name="title"
        defaultValue={initialTitle}
        placeholder="Give this entry a title..."
        className="font-serif text-2xl font-semibold border-0 border-b border-border rounded-none px-0 py-2 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-accent bg-transparent h-auto"
      />

      {/* Mood selector */}
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
        className="journal-prose w-full min-h-[420px] bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/40 text-foreground"
        autoFocus={!initialContent}
      />

      {/* Save */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          {saved ? "Saved ✓" : "Unsaved changes"}
        </span>
        <Button type="submit" disabled={isPending} className="rounded-full px-6">
          {isPending ? "Saving..." : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
