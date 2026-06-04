import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages } = await req.json();

  const conversation = messages
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Friend"}: ${m.content}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `Extract personal facts worth remembering from this conversation. These will be used to help an AI friend remember things about the user in future conversations.

Rules:
- Only extract concrete, specific facts (names, events, feelings about specific things, important life details)
- Skip generic feelings like "felt sad" unless tied to a specific reason
- Max 5 facts, one per line
- Start each line with a lowercase letter, no bullet points
- Examples: "sister named Emma", "anxious about job interview next Friday", "recently moved to New York", "struggling with her relationship with her mom"
- If nothing worth remembering, respond with just: none`,
    messages: [{ role: "user", content: conversation }],
  });

  const text = (response.content[0] as { type: string; text: string }).text.trim();
  if (text === "none" || !text) return new Response("ok");

  const facts = text.split("\n").map((f) => f.trim()).filter(Boolean).slice(0, 5);

  await supabase.from("user_memories").insert(
    facts.map((fact) => ({ user_id: user.id, fact }))
  );

  return new Response("ok");
}
