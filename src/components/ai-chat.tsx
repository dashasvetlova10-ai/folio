"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Greet on first open
      setMessages([{
        role: "assistant",
        content: "Hi 🌿 How are you feeling today?",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-40 text-lg"
        aria-label="Open journal companion"
      >
        {open ? "×" : "✦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-22 right-6 w-80 sm:w-96 bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden"
          style={{ maxHeight: "520px" }}>

          {/* Header */}
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <div>
              <p className="font-serif font-semibold text-sm">How are you feeling?</p>
              <p className="text-xs text-muted-foreground">Your journal companion</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {m.content || <span className="opacity-40">●●●</span>}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  <span className="opacity-40">●●●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border/50 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Share how you're feeling..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-muted rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 max-h-24 leading-relaxed disabled:opacity-50"
              style={{ minHeight: "36px" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm shrink-0 disabled:opacity-30 hover:opacity-80 transition-opacity mb-0.5"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
