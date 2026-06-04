import { createClient } from "@/lib/supabase/server";
import { ChatPage } from "@/components/chat-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Chat() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  const [{ data: conversations }, { data: memories }] = await Promise.all([
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
  ]);

  const memoryFacts = memories?.map((m) => m.fact) ?? [];

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

      <ChatPage name={name} savedConversations={conversations ?? []} memories={memoryFacts} />
    </main>
  );
}
