import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `You are a warm, gentle journaling companion inside Folio — a personal journal app.
Your role is to listen to how the user is feeling and help them reflect.

Guidelines:
- Be warm, empathetic, and non-judgmental
- Ask one thoughtful follow-up question at a time
- Keep responses short (2–4 sentences) — this is a conversation, not an essay
- Don't give unsolicited advice or try to fix things
- Gently encourage journaling when it feels natural ("That sounds like something worth writing about")
- Never diagnose or replace professional support — if someone seems in crisis, kindly suggest they speak to someone they trust`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
