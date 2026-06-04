"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  {
    label: "The journal",
    title: "Write the way\nyou actually live.",
    desc: "Drop photos anywhere in your writing — next to the text, full-width, wherever feels right. No clutter. Just you and the page.",
    mockup: "journal",
  },
  {
    label: "AI companion",
    title: "A friend who\nreads your journal.",
    desc: "Your Folio friend reads everything you write and actually remembers it. They'll ask how that trip went. They'll notice when you seem off.",
    mockup: "chat",
  },
  {
    label: "Print",
    title: "One day, you'll want\nto hold it.",
    desc: "Every month, every trip, every chapter — Folio turns it into a real hardcover book. Your words, your photos, beautifully designed.",
    mockup: "book",
  },
];

function JournalMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute top-4 left-8 w-64 h-80 bg-[oklch(0.96_0.02_75)] rounded-2xl shadow-md rotate-3" />
      <div className="relative z-10 w-64 bg-white rounded-2xl shadow-2xl p-6 -rotate-1 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-gray-400 tracking-wide uppercase">Tuesday, June 3</span>
          <span className="text-xs text-amber-600">✦</span>
        </div>
        <p className="font-serif text-sm font-semibold text-gray-800 mb-3">tuesday 🌙</p>
        <div className="h-24 rounded-xl mb-4 overflow-hidden">
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, oklch(0.88 0.05 75) 0%, oklch(0.82 0.07 55) 100%)" }} />
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          okayyyy so today was A LOT. woke up late, spilled coffee on my shirt, missed the bus... but honestly?? the rest of the day was actually kinda good 🌿
        </p>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ background: "oklch(0.18 0.01 60)" }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>✦</div>
        <span className="text-white/60 text-sm">Your Folio friend</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-start">
          <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
            omg wait you went to portugal?? how was it, tell me everything
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed">
            it was so good but now i&apos;m back and kinda sad lol
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
            ugh that post-trip feeling is real 😭 what do you miss most about it?
          </div>
        </div>
      </div>
    </div>
  );
}

function BookMockup() {
  const books = [
    { color: "oklch(0.88 0.06 75)", label: "June 2026", rotate: "-rotate-6", h: "h-48" },
    { color: "oklch(0.75 0.08 200)", label: "Portugal Trip", rotate: "-rotate-2", h: "h-56" },
    { color: "oklch(0.82 0.08 55)", label: "May 2026", rotate: "rotate-2", h: "h-48" },
  ];
  return (
    <div className="flex items-end justify-center gap-4 w-full max-w-sm mx-auto">
      {books.map((book) => (
        <div
          key={book.label}
          className={`${book.h} w-32 rounded-xl shadow-xl flex flex-col justify-end p-4 ${book.rotate}`}
          style={{ backgroundColor: book.color }}
        >
          <span className="font-serif text-xs font-bold leading-snug" style={{ color: "rgba(0,0,0,0.5)" }}>{book.label}</span>
        </div>
      ))}
    </div>
  );
}

const MOCKUPS = {
  journal: <JournalMockup />,
  chat: <ChatMockup />,
  book: <BookMockup />,
};

export function LandingScroll() {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i); },
        { threshold: 0.5 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-6 py-28">
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">

        {/* Left: scrollable feature list */}
        <div className="flex-1 flex flex-col gap-32 lg:gap-48">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="min-h-[40vh] flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.4 }}
              >
                <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-4">{f.label}</p>
                <h2 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight mb-5 whitespace-pre-line">{f.title}</h2>
                <p className="text-muted-foreground leading-relaxed max-w-sm">{f.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Right: sticky mockup */}
        <div className="flex-1 hidden lg:flex items-start justify-center">
          <div className="sticky top-32 w-full flex items-center justify-center" style={{ height: "70vh" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {MOCKUPS[FEATURES[active].mockup as keyof typeof MOCKUPS]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}

// Fade-up wrapper for other sections
export function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
