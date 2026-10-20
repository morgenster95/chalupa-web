// Práce s daty ve formátu YYYY-MM-DD (kalendářní dny, bez časových pásem).

const RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function toDate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function diffDays(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

/** Seznam nocí (dat příjezdu) od `from` do `to` (bez dne odjezdu). */
export function nightsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 0 = neděle … 6 = sobota */
export function weekday(s: string): number {
  return toDate(s).getUTCDay();
}

/** Dnešní datum v Praze. */
export function todayPrague(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Je MM-DD v intervalu (včetně), i přes přelom roku (např. 12-20 – 01-05)? */
export function inMonthDayRange(date: string, from: string, to: string): boolean {
  const md = date.slice(5);
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

/** Sloučí seznam nocí do souvislých intervalů [from, to). */
export function mergeNights(dates: string[]): { from: string; to: string }[] {
  const sorted = [...new Set(dates)].sort();
  const out: { from: string; to: string }[] = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    if (last && last.to === d) last.to = addDays(d, 1);
    else out.push({ from: d, to: addDays(d, 1) });
  }
  return out;
}
