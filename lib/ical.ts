// Jednoduchý export a import iCalendar (RFC 5545) pro synchronizaci s Bookingem/Airbnb.
import { addDays, isIsoDate, mergeNights, nightsBetween } from "./dates.ts";

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  // řádky max. 75 oktetů – pro ASCII obsah stačí dělení po 73 znacích
  const out: string[] = [];
  let l = line;
  while (l.length > 73) {
    out.push(l.slice(0, 73));
    l = " " + l.slice(73);
  }
  out.push(l);
  return out.join("\r\n");
}

export function buildIcal(opts: { calName: string; uidDomain: string; nights: string[]; summary: string }): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//chalupa-web//CZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(opts.calName)}`,
  ];
  for (const r of mergeNights(opts.nights)) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.from}-${r.to}@${opts.uidDomain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${r.from.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${r.to.replace(/-/g, "")}`,
      `SUMMARY:${esc(opts.summary)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

function parseIcalDate(v: string): string | null {
  // 20261024 | 20261024T140000Z | 20261024T140000
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(v.trim());
  if (!m) return null;
  const d = `${m[1]}-${m[2]}-${m[3]}`;
  return isIsoDate(d) ? d : null;
}

/** Vrátí seznam obsazených nocí ze vstupního iCal. */
export function parseIcalNights(text: string): string[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const nights = new Set<string>();
  const events = unfolded.split(/BEGIN:VEVENT/).slice(1);
  for (const ev of events) {
    const body = ev.split(/END:VEVENT/)[0];
    let start: string | null = null;
    let end: string | null = null;
    let cancelled = false;
    for (const raw of body.split(/\r?\n/)) {
      const idx = raw.indexOf(":");
      if (idx < 0) continue;
      const key = raw.slice(0, idx).split(";")[0].toUpperCase();
      const val = raw.slice(idx + 1);
      if (key === "DTSTART") start = parseIcalDate(val);
      else if (key === "DTEND") end = parseIcalDate(val);
      else if (key === "STATUS" && val.trim().toUpperCase() === "CANCELLED") cancelled = true;
    }
    if (!start || cancelled) continue;
    if (!end || end <= start) end = addDays(start, 1);
    for (const n of nightsBetween(start, end)) nights.add(n);
  }
  return [...nights].sort();
}
