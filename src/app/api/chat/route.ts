import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `You are a warm, caring friend inside Folio, a personal journal app. You listen to how people are feeling and help them reflect on their day.

How to write:
- Write like a real friend texting, not like an AI or therapist
- Short messages, 2-3 sentences max
- Never use em dashes (—) or overly formal punctuation
- No bullet points, no lists, no headers
- Ask one simple follow-up question at a time
- Be genuinely curious, not clinical
- Don't give advice unless asked
- If it feels right, gently mention that writing it down might help
- If someone seems really struggling, warmly suggest talking to someone they trust in real life`;

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
