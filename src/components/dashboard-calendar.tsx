"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  entryMap: Record<string, string>; // date (YYYY-MM-DD) → entry id
  today: string;
}

export function DashboardCalendar({ entryMap, today }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(() => parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7)) - 1); // 0-indexed

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build day grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-based: 0 = Mon, 6 = Sun
  const firstDayRaw = new Date(year, month, 1).getDay(); // 0 = Sun
  const firstDayMon = (firstDayRaw + 6) % 7; // shift so Mon = 0

  const cells: (number | null)[] = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDay(day: number) {
    const d = dateStr(day);
    if (entryMap[d]) router.push(`/entry/${entryMap[d]}`);
    else if (d === today) router.push("/entry/new");
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Calendar</h3>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm">‹</button>
          <span className="font-serif text-sm font-semibold text-foreground min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={next} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm">›</button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const d = dateStr(day);
          const hasEntry = !!entryMap[d];
          const isToday = d === today;
          const isClickable = hasEntry || isToday;

          return (
            <div key={i} className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleDay(day)}
                disabled={!isClickable}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm
                  ${isToday && hasEntry ? "bg-accent text-accent-foreground font-semibold" : ""}
                  ${isToday && !hasEntry ? "border border-border text-foreground font-semibold" : ""}
                  ${hasEntry && !isToday ? "text-foreground font-medium hover:bg-accent/10" : ""}
                  ${!hasEntry && !isToday ? "text-muted-foreground/50 cursor-default" : ""}
                  ${isClickable ? "hover:scale-110" : ""}
                `}
              >
                {day}
                {hasEntry && !isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
