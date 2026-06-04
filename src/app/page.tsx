import { signInWithGoogle } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { LandingScroll, FadeUp } from "@/components/landing-scroll";

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
        <div className="flex-1 text-center lg:text-left">
          <FadeUp>
            <p className="text-xs tracking-[0.2em] uppercase text-accent font-medium mb-5">
              A journal that knows you
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight mb-7">
              Write today.<br />
              <span className="italic">Remember<br />it forever.</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10 mx-auto lg:mx-0">
              A warm, personal journal for the moments that matter. Write, add photos, talk to your AI friend — and one day, hold it all in a beautiful printed book.
            </p>
            <form action={signInWithGoogle} className="flex justify-center lg:justify-start">
              <Button type="submit" size="lg" className="rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-primary/10">
                Start writing — it&apos;s free
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">Takes 10 seconds. No credit card needed.</p>
          </FadeUp>
        </div>

        {/* Hero journal card */}
        <FadeUp delay={0.3}>
          <div className="flex-1 flex justify-center lg:justify-end relative w-full max-w-sm lg:max-w-none">
            <div className="absolute top-4 left-1/2 lg:left-8 -translate-x-1/2 lg:translate-x-0 w-72 h-96 bg-[oklch(0.96_0.02_75)] rounded-2xl shadow-md rotate-3" />
            <div className="relative z-10 w-72 bg-white rounded-2xl shadow-2xl p-7 -rotate-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] text-muted-foreground tracking-wide uppercase">Tuesday, June 3</span>
                <span className="text-xs text-accent">✦</span>
              </div>
              <p className="font-serif text-base font-semibold text-foreground mb-3">tuesday 🌙</p>
              <div className="h-28 rounded-xl mb-4 overflow-hidden">
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg, oklch(0.88 0.05 75) 0%, oklch(0.82 0.07 55) 100%)" }} />
              </div>
              <p className="text-[12px] text-foreground/60 leading-relaxed">
                okayyyy so today was A LOT. woke up late, spilled coffee on my shirt, missed the bus... but honestly?? the rest of the day was actually kinda good 🌿
              </p>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-border/50 bg-muted/30 px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { num: "01", title: "Just write", desc: "Open it like a diary. Add photos wherever they feel right. No overthinking.", delay: 0 },
            { num: "02", title: "A friend who listens", desc: "Your AI friend reads your journal and checks in like someone who actually cares.", delay: 0.1 },
            { num: "03", title: "Hold it in your hands", desc: "Turn any journal into a beautiful printed book — a real keepsake.", delay: 0.2 },
          ].map((s) => (
            <FadeUp key={s.num} delay={s.delay}>
              <div className="flex flex-col items-center gap-3">
                <span className="font-serif text-4xl font-semibold text-accent/30">{s.num}</span>
                <h3 className="font-serif text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Sticky scroll feature showcase ── */}
      <LandingScroll />

      {/* ── Final CTA ── */}
      <section className="border-t border-border/50 px-6 py-28 text-center" style={{ background: "oklch(0.97 0.01 75)" }}>
        <FadeUp>
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
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-8 py-8 flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-serif font-bold text-foreground text-lg">Folio</span>
        <span>© 2026 · Made with care, for the moments that matter.</span>
      </footer>

    </main>
  );
}
