import { createClient } from "@/lib/supabase/server";
import { EntryEditor } from "@/components/entry-editor";
import { deleteEntry } from "@/lib/actions";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!entry) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-[oklch(0.93_0.012_75)]">
      <nav className="flex items-center justify-between px-8 py-5">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Folio
        </Link>
        <div className="flex items-center gap-2">
          <form action={deleteEntry.bind(null, entry.id)}>
            <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Delete
            </Button>
          </form>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex justify-center px-6 pb-16 pt-4">
        <div className="w-full max-w-[620px]">

          {/* Date label */}
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium px-1">
            {formatDate(entry.date)}
          </p>

          {/* Stacked pages effect */}
          <div className="relative">
            <div className="absolute inset-0 translate-x-1.5 translate-y-2 bg-white/60 rounded shadow-sm" />
            <div className="absolute inset-0 translate-x-0.5 translate-y-1 bg-white/80 rounded shadow-sm" />

            {/* Main page */}
            <div className="relative bg-white rounded shadow-[0_8px_40px_rgba(0,0,0,0.10)]">
              <EntryEditor
                id={entry.id}
                initialTitle={entry.title ?? ""}
                initialContent={entry.content}
                initialMood={entry.mood}
                initialImages={entry.images ?? []}
                initialBlocks={entry.blocks}
                date={entry.date}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
