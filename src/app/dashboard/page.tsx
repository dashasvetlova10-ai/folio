import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, todayISO } from "@/lib/utils/date";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false })
    .limit(30);

  const today = todayISO();
  const todayEntry = entries?.find((e) => e.date === today);
  const pastEntries = entries?.filter((e) => e.date !== today) ?? [];

  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight">
          Folio
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/entry/new">
            <Button size="sm">New entry</Button>
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm">Sign out</Button>
          </form>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
        {/* Greeting */}
        <div>
          <p className="text-muted-foreground text-sm mb-1">{formatDate(today)}</p>
          <h2 className="font-serif text-4xl font-bold">Good day, {name}.</h2>
        </div>

        {/* Today */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">Today</h3>
          {todayEntry ? (
            <Link href={`/entry/${todayEntry.id}`}>
              <div className="border border-border rounded-xl p-6 hover:border-accent/50 hover:bg-muted/20 transition-colors group">
                <p className="font-serif text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                  {todayEntry.title || "Untitled"}
                </p>
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                  {todayEntry.content}
                </p>
              </div>
            </Link>
          ) : (
            <Link href="/entry/new">
              <div className="border border-dashed border-border rounded-xl p-8 text-center hover:border-accent/50 hover:bg-muted/20 transition-colors group cursor-pointer">
                <p className="font-serif text-lg text-muted-foreground group-hover:text-foreground transition-colors">
                  You haven&apos;t written today yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">Click to start today&apos;s entry →</p>
              </div>
            </Link>
          )}
        </section>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">Past entries</h3>
            <div className="flex flex-col gap-2">
              {pastEntries.map((entry) => (
                <Link key={entry.id} href={`/entry/${entry.id}`}>
                  <div className="flex items-center justify-between border border-border rounded-lg px-5 py-4 hover:border-accent/50 hover:bg-muted/20 transition-colors group">
                    <div className="flex flex-col">
                      <span className="font-serif font-medium group-hover:text-accent transition-colors">
                        {entry.title || "Untitled"}
                      </span>
                      <span className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                        {entry.content.slice(0, 80)}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0 ml-4">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {entries?.length === 0 && (
          <p className="text-center text-muted-foreground py-12 font-serif text-lg italic">
            Your journal is empty. Start writing.
          </p>
        )}
      </div>
    </main>
  );
}
