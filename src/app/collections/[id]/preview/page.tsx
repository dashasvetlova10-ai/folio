import { createClient } from "@/lib/supabase/server";
import { COVER_COLORS, TYPE_LABELS } from "@/lib/collections";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <main className="min-h-screen bg-[oklch(0.14_0.01_60)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 sticky top-0 z-10 bg-[oklch(0.14_0.01_60)]/95 backdrop-blur border-b border-white/10">
        <Link href={`/collections/${id}`}>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">← Back</Button>
        </Link>
        <span className="font-serif text-white/80 font-semibold">{collection.title}</span>
        <Button size="sm" className="rounded-full opacity-50 cursor-not-allowed" disabled>
          Download PDF
        </Button>
      </div>

      {/* Pages */}
      <div className="flex flex-col items-center gap-8 px-6 py-12">

        {/* Cover page */}
        <div
          style={{ backgroundColor: coverHex }}
          className="w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center text-center px-12 py-20 min-h-[420px]">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/40 mb-6 font-medium">{typeLabel}</p>
            <h1 className="font-serif text-6xl font-bold text-foreground/90 leading-tight mb-6">
              {collection.title}
            </h1>
            <div className="w-12 h-px bg-foreground/30 mb-6" />
            <p className="text-sm text-foreground/50">
              {formatDate(collection.start_date)} — {formatDate(collection.end_date)}
            </p>
            <p className="text-xs text-foreground/30 mt-2 uppercase tracking-widest font-medium">
              {entries?.length ?? 0} entries
            </p>
          </div>
        </div>

        {/* Entry pages */}
        {(entries ?? []).map((entry) => (
          <div
            key={entry.id}
            className="w-full max-w-[560px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-12 py-12">
              {/* Date header */}
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-8 font-medium">
                {formatDate(entry.date)}
              </p>

              {/* Title */}
              {entry.title && (
                <h2 className="font-serif text-3xl font-bold text-gray-900 leading-snug mb-6">
                  {entry.title}
                </h2>
              )}

              {/* Mood */}
              {entry.mood && (
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-6 font-medium">
                  {entry.mood}
                </p>
              )}

              {/* Blocks (or fallback to content+images) */}
              {Array.isArray(entry.blocks) && entry.blocks.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {(entry.blocks as Array<{type: string; content?: string; url?: string; size?: string}>).map((block, bi) =>
                    block.type === "text" ? (
                      <div key={bi} className="font-serif text-[1.05rem] leading-[1.9] text-gray-800 whitespace-pre-wrap">
                        {block.content}
                      </div>
                    ) : (
                      <img
                        key={bi}
                        src={block.url}
                        alt=""
                        className="rounded-lg object-cover shadow-sm"
                        style={{
                          width: block.size === "sm" ? "30%" : block.size === "md" ? "48%" : "100%",
                          aspectRatio: block.size === "lg" ? "16/9" : "1/1",
                        }}
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="font-serif text-[1.05rem] leading-[1.9] text-gray-800 whitespace-pre-wrap">
                  {entry.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Back cover */}
        <div
          style={{ backgroundColor: coverHex }}
          className="w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center text-center px-12 py-16 min-h-[200px]">
            <p className="font-serif text-2xl font-bold text-foreground/60 italic">Folio</p>
            <p className="text-xs text-foreground/30 mt-2 uppercase tracking-widest">folio.earth</p>
          </div>
        </div>

      </div>
    </main>
  );
}
