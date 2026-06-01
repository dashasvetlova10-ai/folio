"use client";

import { useState } from "react";
import { createCollection } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPES = [
  { value: "monthly",   symbol: "◯", label: "Monthly",   desc: "A full month of daily entries" },
  { value: "trip",      symbol: "→", label: "Trip",       desc: "A journey or travel period" },
  { value: "pregnancy", symbol: "♥", label: "Pregnancy",  desc: "Your pregnancy journey" },
  { value: "custom",    symbol: "✦", label: "Custom",     desc: "Any date range you choose" },
];

const COLORS = [
  { value: "sand",     hex: "#e8d9c4" },
  { value: "sage",     hex: "#c8d9c4" },
  { value: "blush",    hex: "#e8c4c4" },
  { value: "slate",    hex: "#c4ccd8" },
  { value: "amber",    hex: "#e8d0a0" },
  { value: "lavender", hex: "#d4c8e8" },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function NewCollectionForm() {
  const [type, setType] = useState("monthly");
  const [color, setColor] = useState("sand");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <form action={createCollection} className="flex flex-col gap-8">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="cover_color" value={color} />

      {/* Type */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Book type</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                type === t.value
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-accent text-lg block mb-1">{t.symbol}</span>
              <span className="font-serif font-semibold text-sm block">{t.label}</span>
              <span className="text-xs text-muted-foreground leading-snug">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title — not needed for monthly */}
      {type !== "monthly" && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Title</p>
          <Input
            name="title"
            placeholder={
              type === "trip" ? "e.g. Italy Summer 2026"
              : type === "pregnancy" ? "e.g. Baby #1"
              : "e.g. My 2026 journal"
            }
            required
          />
        </div>
      )}

      {/* Date range */}
      {type === "monthly" ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Month</p>
            <select
              name="month"
              defaultValue={currentMonth}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Year</p>
            <select
              name="year"
              defaultValue={currentYear}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Start date</p>
            <Input type="date" name="start_date" required />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">End date</p>
            <Input type="date" name="end_date" required />
          </div>
        </div>
      )}

      {/* Cover color */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Cover color</p>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              style={{ backgroundColor: c.hex }}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c.value
                  ? "ring-2 ring-offset-2 ring-foreground scale-110"
                  : "hover:scale-105"
              }`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="self-start px-8 rounded-full">
        Create book
      </Button>
    </form>
  );
}
