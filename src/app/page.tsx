import { signInWithGoogle } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border/50">
        <span className="font-serif text-2xl font-bold tracking-tight">Folio</span>
        <form action={signInWithGoogle}>
          <Button variant="outline" size="sm">Sign in</Button>
        </form>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto">
        <p className="text-sm tracking-widest uppercase text-muted-foreground mb-6 font-medium">
          Your daily practice
        </p>
        <h1 className="font-serif text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
          Write today.<br />
          <span className="italic text-accent">Print forever.</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
          Folio is a beautiful daily journal that turns your thoughts into a book you can hold.
          Write every day, then print your journal as a stylish hardcover.
        </p>
        <form action={signInWithGoogle}>
          <Button size="lg" className="text-base px-8 py-6 rounded-full font-medium">
            Start writing with Google
          </Button>
        </form>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { icon: "✦", title: "Write daily", desc: "A calm, distraction-free editor. Just you and your thoughts." },
            { icon: "◈", title: "Beautiful design", desc: "Every entry is typeset with care — ready to look stunning in print." },
            { icon: "⬡", title: "Print your book", desc: "Export as a polished PDF or order a real hardcover of your journal." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-3">
              <span className="text-accent text-2xl">{f.icon}</span>
              <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-8 py-6 flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-serif font-semibold">Folio</span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
