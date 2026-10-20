import "server-only";
import { siteUrl } from "./config";
import { addDays, todayPrague } from "./dates";
import { db, getSettings } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import { parseIcalNights } from "./ical";
import { ROOMS } from "./rooms";
import { sign } from "./tokens";
import type { IcalStatus, RoomId, Settings } from "./types";

export function icalExportToken(s: Settings): string {
  return s.icalToken && s.icalToken !== DEFAULT_SETTINGS.icalToken ? s.icalToken : sign("ical", "export");
}

export function icalExportUrl(s: Settings, roomId: RoomId): string {
  return `${siteUrl()}/api/ical/${ROOMS[roomId].slug}.ics?token=${icalExportToken(s)}`;
}

/**
 * Stáhne kalendáře z Bookingu/Airbnb a zapíše obsazené noci.
 * Do exportu se importované noci NEposílají zpět (zabránění smyčce mezi portály) – exportujeme jen vlastní rezervace a blokace.
 */
export async function importAllIcal(): Promise<IcalStatus> {
  const s = await getSettings();
  const store = await db();
  const today = todayPrague();
  const horizon = addDays(today, 730);
  const results: IcalStatus["results"] = [];
  for (const imp of s.icalImports) {
    try {
      const res = await fetch(imp.url, { headers: { "User-Agent": "chalupa-web/1.0" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Odpověď není iCal kalendář");
      const nights = parseIcalNights(text).filter((d) => d >= today && d < horizon);
      const { conflicts } = await store.replaceIcalNights(imp.roomId, imp.id, nights);
      results.push({ importId: imp.id, name: imp.name, ok: true, nights: nights.length, conflicts });
    } catch (e) {
      results.push({ importId: imp.id, name: imp.name, ok: false, nights: 0, conflicts: [], error: e instanceof Error ? e.message : String(e) });
    }
  }
  const status: IcalStatus = { at: new Date().toISOString(), results };
  await store.setMeta("icalStatus", status);
  return status;
}

/** Odstraní noci importu, který byl smazán z nastavení. */
export async function removeIcalImport(roomId: RoomId, importId: string) {
  await (await db()).replaceIcalNights(roomId, importId, []);
}
