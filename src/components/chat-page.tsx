"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SavedConversation {
  id: string;
  title: string;
  created_at: string;
}

const STARTERS = [
  "Can you look through my journal and tell me how I've been doing?",
  "I'm feeling a bit overwhelmed today",
  "Something good happened and I want to share it",
  "I just need to vent",
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
  } catch {
    // Push not supported or denied — silent fail
  }
}

export function ChatPage({
  name,
  savedConversations,
  memories,
  journalContext,
}: {
  name: string;
  savedConversations: SavedConversation[];
  memories: string[];
  journalContext: string;
}) {
  const [view, setView] = useState<"home" | "chat">("home");
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [convList, setConvList] = useState<SavedConversation[]>(savedConversations);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (view === "chat") setTimeout(() => inputRef.current?.focus(), 100);
  }, [view]);

  // Register for push notifications on first visit
  useEffect(() => {
    registerPush();
  }, []);

  async function loadConversation(conv: SavedConversation) {
    const supabase = createClient();
    const { data } = await supabase.from("conversations").select("messages").eq("id", conv.id).single();
    if (data) {
      setMessages((data.messages as unknown as Message[]) ?? []);
      setConvId(conv.id);
      setView("chat");
    }
  }

  function startNew() {
    setMessages([]);
    setConvId(null);
    setView("chat");
  }

  async function saveMessages(msgs: Message[], existingId: string | null): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (existingId) {
      await supabase.from("conversations").update({
        messages: msgs as unknown as import("@/lib/supabase/types").Json,
        updated_at: new Date().toISOString(),
      }).eq("id", existingId);
      return existingId;
    } else {
      const title = msgs.find((m) => m.role === "user")?.content.slice(0, 60) ?? "Conversation";
      const { data } = await supabase.from("conversations")
        .insert({ user_id: user.id, title, messages: msgs as unknown as import("@/lib/supabase/types").Json })
        .select("id").single();
      if (data) {
        setConvList((prev) => [{ id: data.id, title, created_at: new Date().toISOString() }, ...prev]);
        return data.id;
      }
    }
    return null;
  }

  async function extractMemories(msgs: Message[]) {
    // Only extract if conversation has at least 3 messages
    if (msgs.length < 3) return;
    try {
      await fetch("/api/extract-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch {
      // Silent fail — memory extraction is non-critical
    }
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setView("chat");

    const newMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, memories, journalContext }),
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

      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: reply }];
      const savedId = await saveMessages(finalMessages, convId);
      if (savedId && !convId) setConvId(savedId);

      // Extract memories in the background after every AI response
      extractMemories(finalMessages);

    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong, try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Home screen
  if (view === "home") {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pb-8">
        <div className="flex flex-col items-center text-center pt-14 pb-8">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl mb-5">✦</div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Hi, {name}.</h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            This is your space. Talk about how you&apos;re feeling, what&apos;s on your mind, or just share your day.
          </p>
        </div>

        {/* Starter prompts */}
        <div className="flex flex-col gap-2 mb-8">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 text-sm transition-colors border border-white/10">
              {s}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-end gap-3 mb-10">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Or type how you're feeling..." rows={1} autoFocus
            className="flex-1 resize-none border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 leading-relaxed"
            style={{ minHeight: "48px", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <button onClick={() => send()} disabled={!input.trim()}
            className="w-11 h-11 bg-white text-gray-900 rounded-full flex items-center justify-center text-sm shrink-0 disabled:opacity-20 hover:bg-white/90 transition-opacity mb-0.5">↑</button>
        </div>

        {/* Past conversations */}
        {convList.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-medium mb-3">Past conversations</p>
            <div className="flex flex-col gap-2">
              {convList.map((c) => (
                <button key={c.id} onClick={() => loadConversation(c)}
                  className="text-left px-4 py-3 rounded-xl border border-white/8 transition-colors group"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors truncate">{c.title}</p>
                  <p className="text-xs text-white/25 mt-0.5">{timeAgo(c.created_at)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chat screen
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pb-8" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between py-2 mb-2">
        <button onClick={() => setView("home")} className="text-sm text-white/40 hover:text-white/70 transition-colors">← All chats</button>
        <button onClick={startNew} className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 px-3 py-1 rounded-full">New chat</button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0 mr-3 mt-1">✦</div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user" ? "bg-white text-gray-900 rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"
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

      <div className="flex items-end gap-3 pt-3">
        <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Say something..." rows={1} disabled={loading}
          className="flex-1 resize-none border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 max-h-32 leading-relaxed disabled:opacity-50"
          style={{ minHeight: "48px", backgroundColor: "rgba(255,255,255,0.06)" }} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="w-11 h-11 bg-white text-gray-900 rounded-full flex items-center justify-center text-sm shrink-0 disabled:opacity-20 hover:bg-white/90 transition-opacity mb-0.5">↑</button>
      </div>
      <p className="text-center text-white/20 text-[11px] mt-3">Not a substitute for professional support.</p>
    </div>
  );
}
