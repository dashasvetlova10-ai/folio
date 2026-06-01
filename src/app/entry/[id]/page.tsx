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
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight">
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

      <div className="max-w-2xl mx-auto w-full px-6 py-12">
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-widest font-medium">
          {formatDate(entry.date)}
        </p>
        <EntryEditor
          id={entry.id}
          initialTitle={entry.title ?? ""}
          initialContent={entry.content}
          initialMood={entry.mood}
          date={entry.date}
        />
      </div>
    </main>
  );
}
