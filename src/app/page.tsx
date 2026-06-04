import { signInWithGoogle } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-6 sticky top-0 bg-background/90 backdrop-blur z-50 border-b border-border/40">
        <span className="font-serif text-2xl font-bold tracking-tight">Folio</span>
        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" size="sm" className="rounded-full px-5">Sign in</Button>
        </form>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-6 pt-24 pb-32 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-5">
            A journal that knows you
          </p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight mb-7">
            Write today.<br />
            <span className="italic">Remember<br />it forever.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10 mx-auto lg:mx-0">
            A warm, personal journal for the moments that matter. Write, add photos, talk to your AI friend — and one day, hold it all in a beautiful printed book.
          </p>
          <form action={signInWithGoogle} className="flex justify-center lg:justify-start">
            <Button type="submit" size="lg" className="rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-primary/10">
              Start writing — it&apos;s free
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">Takes 10 seconds. No credit card needed.</p>
        </div>

        {/* Journal mockup */}
        <div className="flex-1 flex justify-center lg:justify-end relative w-full max-w-sm lg:max-w-none">
          {/* Back card */}
          <div className="absolute top-4 left-1/2 lg:left-8 -translate-x-1/2 lg:translate-x-0 w-72 h-96 bg-[oklch(0.96_0.02_75)] rounded-2xl shadow-md rotate-3" />
          {/* Main card */}
          <div className="relative z-10 w-72 bg-white rounded-2xl shadow-2xl p-7 -rotate-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-muted-foreground tracking-wide uppercase">Tuesday, June 3</span>
              <span className="text-xs text-accent">✦</span>
            </div>
            {/* Title */}
            <p className="font-serif text-base font-semibold text-foreground mb-3">A slow morning in Lisbon</p>
            {/* Photo */}
            <div className="h-28 rounded-xl mb-4 overflow-hidden">
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, oklch(0.88 0.05 75) 0%, oklch(0.82 0.07 55) 100%)" }} />
            </div>
            {/* Real journal text */}
            <p className="text-[12px] text-foreground/60 leading-relaxed">
              Woke up before everyone else. The city was quiet — just pigeons and the smell of coffee from somewhere below. I sat by the window for almost an hour and didn&apos;t check my phone once.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-border/50 bg-muted/30 px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { num: "01", title: "Just write", desc: "Open it like a diary. Add photos wherever they feel right. No overthinking." },
            { num: "02", title: "A friend who listens", desc: "Your AI friend reads your journal and checks in like someone who actually cares." },
            { num: "03", title: "Hold it in your hands", desc: "Turn any journal into a beautiful printed book — a real keepsake." },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-3">
              <span className="font-serif text-4xl font-bold text-accent/30">{s.num}</span>
              <h3 className="font-serif text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature: Editor ── */}
      <section className="max-w-6xl mx-auto px-6 py-28 flex flex-col lg:flex-row items-center gap-16">
        {/* Editor mockup */}
        <div className="flex-1 relative">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-border/50">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>
            <div className="p-6">
              {/* Title */}
              <p className="font-serif text-base font-semibold text-foreground mb-1">First day in the mountains</p>
              <p className="text-[10px] text-muted-foreground mb-5 uppercase tracking-wide">Saturday, May 24</p>
              {/* Text block */}
              <p className="text-[11px] text-foreground/60 leading-relaxed mb-5">
                The drive up took three hours but none of it felt long. Every turn had a different view.
              </p>
              {/* Side-by-side: text + photo */}
              <div className="flex gap-3 mb-4">
                <p className="flex-1 text-[11px] text-foreground/60 leading-relaxed">
                  We stopped at a tiny café that had no menu — just whatever they made that morning. It was the best soup I&apos;ve ever had.
                </p>
                <div className="w-24 h-20 rounded-lg shrink-0" style={{ background: "linear-gradient(135deg, oklch(0.88 0.05 75) 0%, oklch(0.80 0.08 55) 100%)" }} />
              </div>
              {/* Full-width photo */}
              <div className="w-full h-20 rounded-lg" style={{ background: "linear-gradient(135deg, oklch(0.85 0.06 200) 0%, oklch(0.78 0.08 240) 100%)" }} />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 max-w-sm mx-auto lg:mx-0">
          <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-4">The journal</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight mb-5">
            Write the way<br /><span className="italic">you actually live.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-5">
            Life isn&apos;t just words, and your journal shouldn&apos;t be either. Drop photos anywhere in your writing — next to the text, full-width, wherever feels right. Move them around, resize them. Make it yours.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            No clutter. No distractions. Just you and the page, the way journaling is supposed to feel.
          </p>
        </div>
      </section>

      {/* ── Feature: AI friend (dark) ── */}
      <section className="bg-[oklch(0.14_0.01_60)] px-6 py-28">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
          {/* Chat mockup */}
          <div className="flex-1 w-full max-w-sm mx-auto">
            <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.18 0.01 60)" }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.1)" }}>✦</div>
                <span className="text-white/60 text-sm">Your Folio friend</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
                    Hey, I noticed you wrote about your trip to Portugal last week. How are you feeling now that you're back?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                    Honestly still a bit sad it's over. It felt so freeing.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
                    That makes complete sense. What part did you miss the most?
                  </div>
                </div>
                <div className="flex justify-end opacity-50">
                  <div className="max-w-[80%] bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-br-sm text-sm">
                    <span className="opacity-40">typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 max-w-sm mx-auto lg:mx-0 text-center lg:text-left">
            <p className="text-xs tracking-[0.2em] uppercase font-medium mb-4" style={{ color: "oklch(0.72 0.12 65)" }}>AI companion</p>
            <h2 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight mb-5 text-white">
              A friend who<br /><span className="italic">reads your journal.</span>
            </h2>
            <p className="leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
              Your Folio friend reads everything you write — and actually remembers it. They&apos;ll ask how that trip went. They&apos;ll notice when you seem stressed. They&apos;ll check in on the things that matter to you.
            </p>
            <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Sometimes you just need someone who listens. This is that.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature: Book ── */}
      <section className="max-w-6xl mx-auto px-6 py-28 flex flex-col items-center text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-4">Print</p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6">
          One day, you&apos;ll want<br />
          <span className="italic">to hold it.</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-xl mb-16">
          Every month, every trip, every chapter of your life — Folio can turn it into a real hardcover book. Your words, your photos, beautifully designed. Something to keep. Something to give.
        </p>

        {/* Book covers mockup */}
        <div className="flex items-end justify-center gap-5 flex-wrap">
          {[
            { color: "oklch(0.88 0.06 75)", label: "June 2026", rotate: "-rotate-6", h: "h-52" },
            { color: "oklch(0.75 0.08 200)", label: "Portugal Trip", rotate: "-rotate-2", h: "h-60" },
            { color: "oklch(0.82 0.08 55)", label: "May 2026", rotate: "rotate-1", h: "h-52" },
            { color: "oklch(0.72 0.06 300)", label: "Pregnancy", rotate: "rotate-4", h: "h-56" },
          ].map((book) => (
            <div
              key={book.label}
              className={`${book.h} w-36 rounded-xl shadow-xl flex flex-col justify-end p-4 ${book.rotate} transition-transform hover:rotate-0 hover:scale-105 duration-300 cursor-default`}
              style={{ backgroundColor: book.color }}
            >
              <span className="font-serif text-xs font-bold leading-snug" style={{ color: "rgba(0,0,0,0.55)" }}>{book.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-10">Monthly journals, travel diaries, pregnancy logs, and more.</p>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-border/50 px-6 py-28 text-center" style={{ background: "oklch(0.97 0.01 75)" }}>
        <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-5">
          Your story is<br /><span className="italic">already worth writing.</span>
        </h2>
        <p className="text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
          Start today. Even one sentence. Folio will be here every time you come back.
        </p>
        <form action={signInWithGoogle} className="flex justify-center">
          <Button type="submit" size="lg" className="rounded-full px-10 py-6 text-base font-medium shadow-lg shadow-primary/10">
            Open Folio — it&apos;s free
          </Button>
        </form>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-8 py-8 flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-serif font-bold text-foreground text-lg">Folio</span>
        <span>© 2026 · Made with care, for the moments that matter.</span>
      </footer>

    </main>
  );
}
