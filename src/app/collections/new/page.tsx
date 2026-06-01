import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewCollectionForm } from "./new-collection-form";

export default function NewCollectionPage() {
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

      <div className="max-w-xl mx-auto w-full px-6 py-12">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">New book</p>
        <h1 className="font-serif text-4xl font-bold mb-10">Create a book</h1>
        <NewCollectionForm />
      </div>
    </main>
  );
}
