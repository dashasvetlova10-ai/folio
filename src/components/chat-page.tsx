"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "I'm feeling a bit overwhelmed today",
  "Something good happened and I want to share it",
  "I've been anxious and don't know why",
  "I just need to vent",
];

export function ChatPage({ name }: { name: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setStarted(true);

    const newMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      let reply = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += new TextDecoder().decode(value);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: reply };
          return next;
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pb-8" style={{ minHeight: 0 }}>

      {/* Header */}
      {!started && (
        <div className="flex flex-col items-center text-center pt-16 pb-10">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl mb-5">✦</div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Hi, {name}.</h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            This is your space. Talk about how you&apos;re feeling, what&apos;s on your mind, or just share your day.
            I&apos;m here to listen.
          </p>

          {/* Starter prompts */}
          <div className="flex flex-col gap-2 mt-8 w-full max-w-sm">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 text-sm transition-colors border border-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {started && (
        <div className="flex-1 overflow-y-auto py-8 flex flex-col gap-4" style={{ minHeight: 0 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0 mr-3 mt-1">✦</div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-white text-gray-900 rounded-br-sm"
                  : "bg-white/10 text-white/90 rounded-bl-sm"
              }`}>
                {m.content || <span className="opacity-30 text-lg">● ● ●</span>}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0 mr-3">✦</div>
              <div className="bg-white/10 text-white/40 px-4 py-3 rounded-2xl rounded-bl-sm text-sm">● ● ●</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className={`flex items-end gap-3 ${!started ? "mt-4" : ""}`}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={started ? "Say something..." : "Or type how you're feeling..."}
          rows={1}
          disabled={loading}
          autoFocus
          className="flex-1 resize-none bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 max-h-32 leading-relaxed disabled:opacity-50"
          style={{ minHeight: "48px", backgroundColor: "rgba(255,255,255,0.06)" }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-11 h-11 bg-white text-gray-900 rounded-full flex items-center justify-center text-sm shrink-0 disabled:opacity-20 hover:bg-white/90 transition-opacity mb-0.5"
        >
          ↑
        </button>
      </div>

      <p className="text-center text-white/20 text-[11px] mt-3">
        This is not a substitute for professional mental health support.
      </p>
    </div>
  );
}
