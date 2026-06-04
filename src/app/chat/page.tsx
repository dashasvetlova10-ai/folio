import { createClient } from "@/lib/supabase/server";
import { ChatPage } from "@/components/chat-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Chat() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  const [{ data: conversations }, { data: memories }, { data: entries }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("user_memories")
      .select("fact")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("entries")
      .select("date, title, content, mood, blocks")
      .eq("user_id", user!.id)
      .order("date", { ascending: false })
      .limit(20),
  ]);

  const memoryFacts = memories?.map((m) => m.fact) ?? [];

  // Format entries as readable journal context for the AI
  const journalContext = (entries ?? []).map((e) => {
    // Extract text from blocks if available
    let text = e.content ?? "";
    if (e.blocks && Array.isArray(e.blocks)) {
      const blockText = (e.blocks as Array<{ type: string; text?: string }>)
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text)
        .join(" ");
      if (blockText.trim()) text = blockText;
    }
    const snippet = text.slice(0, 600);
    const mood = e.mood ? ` [feeling: ${e.mood}]` : "";
    const title = e.title ? ` — "${e.title}"` : "";
    return `${e.date}${title}${mood}\n${snippet}${text.length > 600 ? "..." : ""}`;
  }).join("\n\n---\n\n");

  return (
    <main className="min-h-screen flex flex-col bg-[oklch(0.14_0.01_60)]">
      <nav className="flex items-center justify-between px-8 py-5">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight text-white/80">
          Folio
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">← Back</Button>
        </Link>
      </nav>

      <ChatPage name={name} savedConversations={conversations ?? []} memories={memoryFacts} journalContext={journalContext} />
    </main>
  );
}
