import { createClient } from "@/lib/supabase/server";
import { ChatPage } from "@/components/chat-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Chat() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

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

      <ChatPage name={name} />
    </main>
  );
}
