import Anthropic from "@anthropic-ai/sdk";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  // Protect cron endpoint
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();

  // Get all push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription");

  if (!subscriptions?.length) return new Response("no subscribers");

  for (const row of subscriptions) {
    // Load this user's memories
    const { data: memories } = await supabase
      .from("user_memories")
      .select("fact")
      .eq("user_id", row.user_id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (!memories?.length) continue;

    const memoryList = memories.map((m) => m.fact).join("\n");

    // Generate a personal check-in message
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: `You are a caring friend sending a short check-in notification. Based on what you know about this person, write ONE short, warm, personal message (1 sentence max). Reference something specific from their life. Write like a real friend texting. No em dashes. No quotes around the message. Just the text.`,
      messages: [{
        role: "user",
        content: `What I know about this person:\n${memoryList}\n\nWrite a check-in message.`,
      }],
    });

    const message = (response.content[0] as { type: string; text: string }).text.trim();

    try {
      await webpush.sendNotification(
        row.subscription as unknown as webpush.PushSubscription,
        JSON.stringify({ title: "Folio", body: message, url: "/chat" })
      );
    } catch {
      // Subscription expired — remove it
      await supabase.from("push_subscriptions").delete().eq("user_id", row.user_id);
    }
  }

  return new Response("done");
}
