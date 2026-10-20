"use client";

import { useMemo, useState } from "react";
import { addDays, nightsBetween } from "@/lib/dates";
import Icon from "./Icon";

interface Props {
  locale: string;
  today: string;
  busy: Set<string>;
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  labels: { prevMonth: string; nextMonth: string; legendFree: string; legendBusy: string; legendSelected: string };
  monthsAhead?: number;
}

const INTL: Record<string, string> = { cs: "cs-CZ", en: "en-GB", de: "de-DE" };

function monthStart(iso: string) {
  return iso.slice(0, 8) + "01";
}
function addMonths(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return d.toISOString().slice(0, 10);
}

export default function RangeCalendar({ locale, today, busy, from, to, onChange, labels, monthsAhead = 17 }: Props) {
  const first = monthStart(today);
  const last = addMonths(first, monthsAhead);
  const [view, setView] = useState(() => (from ? monthStart(from) : first));
  const [hover, setHover] = useState<string | null>(null);

  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(INTL[locale] ?? "cs-CZ", { month: "long", year: "numeric", timeZone: "UTC" }), [locale]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(INTL[locale] ?? "cs-CZ", { weekday: "short", timeZone: "UTC" });
    // 2024-01-01 bylo pondělí
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }, [locale]);

  const rangeFree = (a: string, b: string) => nightsBetween(a, b).every((n) => !busy.has(n));

  const click = (d: string) => {
    if (d < today) return;
    if (!from || (from && to)) {
      if (!busy.has(d)) onChange(d, null);
      return;
    }
    if (d <= from) {
      if (!busy.has(d)) onChange(d, null);
      return;
    }
    if (rangeFree(from, d)) onChange(from, d);
    else if (!busy.has(d)) onChange(d, null);
  };

  const preview = from && !to && hover && hover > from && rangeFree(from, hover) ? hover : null;
  const endSel = to ?? preview;

  const months = [view, addMonths(view, 1)];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, -1))}
          disabled={view <= first}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-wood transition hover:bg-cream disabled:opacity-30"
          aria-label={labels.prevMonth}
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          type="button"
          onClick={() => setView((v) => addMonths(v, 1))}
          disabled={addMonths(view, 1) >= last}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-wood transition hover:bg-cream disabled:opacity-30"
          aria-label={labels.nextMonth}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {months.map((ms, mi) => {
          const d0 = new Date(ms + "T00:00:00Z");
          const offset = (d0.getUTCDay() + 6) % 7;
          const daysInMonth = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 0)).getUTCDate();
          const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDays(ms, i))];
          return (
            <div key={ms} className={mi === 1 ? "hidden sm:block" : ""}>
              <p className="mb-3 text-center font-serif text-lg capitalize text-wood">{fmtMonth.format(d0)}</p>
              <div className="grid grid-cols-7 gap-y-1 text-center text-[0.7rem] font-bold uppercase tracking-wide text-muted">
                {weekdays.map((w) => (
                  <span key={w} className="pb-1">
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHover(null)}>
                {cells.map((d, i) => {
                  if (!d) return <span key={"e" + i} />;
                  const past = d < today;
                  const isBusy = busy.has(d);
                  const isStart = d === from;
                  const isEnd = d === endSel;
                  const inRange = from && endSel && d > from && d < endSel;
                  // den odjezdu může být obsazený (odjíždíte ráno, další host přijíždí odpoledne)
                  const selectableAsEnd = from && !to && d > from && rangeFree(from, d);
                  const disabled = past || (isBusy && !selectableAsEnd);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={disabled}
                      onClick={() => click(d)}
                      onMouseEnter={() => setHover(d)}
                      aria-pressed={isStart || isEnd}
                      aria-label={d}
                      className={[
                        "relative mx-auto flex h-10 w-full items-center justify-center text-sm transition sm:h-11",
                        inRange ? "bg-honey-light/70 text-wood" : "",
                        isStart && endSel ? "rounded-l-full bg-honey-light/70" : "",
                        isEnd ? "rounded-r-full bg-honey-light/70" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10",
                          isStart || isEnd ? "bg-honey font-bold text-white shadow-soft" : "",
                          !isStart && !isEnd && !disabled ? "hover:bg-cream" : "",
                          past ? "text-muted/40" : "",
                          isBusy && !past && !isStart && !isEnd ? "bg-busy text-muted/60 line-through decoration-muted/40" : "",
                          isBusy && selectableAsEnd && !isEnd ? "!no-underline" : "",
                          d === today && !isStart ? "ring-1 ring-sage" : "",
                        ].join(" ")}
                      >
                        {Number(d.slice(8))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border border-line bg-white" /> {labels.legendFree}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-busy" /> {labels.legendBusy}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-honey" /> {labels.legendSelected}
        </span>
      </div>
    </div>
  );
}
