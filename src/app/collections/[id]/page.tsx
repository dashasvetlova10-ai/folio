import { createClient } from "@/lib/supabase/server";
import { deleteCollection } from "@/lib/actions";
import { COVER_COLORS, TYPE_LABELS } from "@/lib/collections";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!collection) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", collection.start_date)
    .lte("date", collection.end_date)
    .order("date", { ascending: true });

  const coverHex = COVER_COLORS[collection.cover_color] ?? COVER_COLORS.sand;
  const typeLabel = TYPE_LABELS[collection.type] ?? "Journal";
  const entryCount = entries?.length ?? 0;

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight">
          Folio
        </Link>
        <div className="flex items-center gap-2">
          <form action={deleteCollection.bind(null, collection.id)}>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Delete
            </Button>
          </form>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        </div>
      </nav>

      {/* Book header */}
      <div
        style={{ backgroundColor: coverHex }}
        className="w-full px-8 py-16 flex flex-col items-center text-center"
      >
        <span className="text-xs uppercase tracking-widest text-foreground/50 mb-3 font-medium">{typeLabel}</span>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground/90 mb-3">
          {collection.title}
        </h1>
        <p className="text-sm text-foreground/50">
          {formatDate(collection.start_date)} — {formatDate(collection.end_date)}
        </p>
        <p className="text-sm text-foreground/40 mt-1">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </p>

        {/* Future actions */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" size="sm" className="rounded-full opacity-40 cursor-not-allowed" disabled>
            Preview book
          </Button>
          <Button size="sm" className="rounded-full opacity-40 cursor-not-allowed" disabled>
            Order print
          </Button>
        </div>
        <p className="text-xs text-foreground/30 mt-2">PDF & print coming soon</p>
      </div>

      {/* Entries */}
      <div className="max-w-3xl mx-auto w-full px-6 py-12">
        {entryCount === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-muted-foreground italic mb-2">No entries yet in this period.</p>
            <p className="text-sm text-muted-foreground">
              Write entries between {formatDate(collection.start_date)} and {formatDate(collection.end_date)} and they&apos;ll appear here.
            </p>
            <Link href="/entry/new" className="mt-6 inline-block">
              <Button className="rounded-full mt-4">Write today&apos;s entry</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries!.map((entry) => (
              <Link key={entry.id} href={`/entry/${entry.id}`}>
                <div className="flex items-center justify-between border border-border rounded-lg px-5 py-4 hover:border-accent/50 hover:bg-muted/20 transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-serif font-medium group-hover:text-accent transition-colors">
                      {entry.title || "Untitled"}
                    </span>
                    <span className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                      {entry.content.slice(0, 90)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-4">
                    {formatDate(entry.date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
