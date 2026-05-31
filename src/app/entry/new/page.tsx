import { EntryEditor } from "@/components/entry-editor";
import { todayISO, formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewEntryPage() {
  const today = todayISO();

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <Link href="/dashboard" className="font-serif text-2xl font-bold tracking-tight">
          Folio
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-12">
        <p className="text-sm text-muted-foreground mb-8 uppercase tracking-widest font-medium">
          {formatDate(today)}
        </p>
        <EntryEditor date={today} />
      </div>
    </main>
  );
}
