"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import * as svc from "@/lib/booking";
import { db, getSettings } from "@/lib/db";
import { importAllIcal, removeIcalImport } from "@/lib/ical-sync";
import { isValidIban, normalizeIban } from "@/lib/spayd";
import { newId, verify } from "@/lib/tokens";
import { ROOM_IDS, type Booking, type RoomId, type Season, type Settings } from "@/lib/types";

function back(path: string, r: { ok: boolean; message: string }): never {
  revalidatePath("/admin", "layout");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${r.ok ? "msg" : "err"}=${encodeURIComponent(r.message)}`);
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, min = 0, max = 1_000_000) => {
  const n = Number(str(fd, k).replace(",", "."));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

// ---------- Rezervace ----------

export async function bookingAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const action = str(fd, "action");
  const path = `/admin/rezervace/${id}`;
  let r: svc.ActionResult;
  switch (action) {
    case "confirm":
      r = await svc.confirmInquiry(id, admin.email);
      break;
    case "decline":
      r = await svc.declineInquiry(id, admin.email);
      break;
    case "cancel":
      r = await svc.cancelBooking(id, admin.email, bool(fd, "notify"));
      break;
    case "payment":
      r = await svc.setPaymentStatus(id, str(fd, "paymentStatus") as Booking["paymentStatus"], admin.email);
      break;
    default:
      r = { ok: false, message: "Neznámá akce." };
  }
  back(path, r);
}

/** Potvrzení / odmítnutí z odkazu v e-mailu (chráněno podepsaným tokenem, bez přihlášení). */
export async function decideFromEmail(fd: FormData) {
  const id = str(fd, "id");
  const t = str(fd, "t");
  const a = str(fd, "a");
  if (!verify("decide", id, t)) back(`/admin/rozhodnuti/${id}?a=${a}&t=${t}`, { ok: false, message: "Neplatný odkaz." });
  const r = a === "confirm" ? await svc.confirmInquiry(id, "majitel (e-mail)") : await svc.declineInquiry(id, "majitel (e-mail)");
  back(`/admin/rozhodnuti/${id}?a=${a}&t=${t}&done=1`, r);
}

// ---------- Blokace ----------

export async function addBlock(fd: FormData) {
  await requireAdmin();
  const rooms = fd.getAll("roomId").map(String).filter((r): r is RoomId => (ROOM_IDS as readonly string[]).includes(r));
  if (!rooms.length) back("/admin/obsazenost", { ok: false, message: "Vyberte pokoj." });
  const msgs: string[] = [];
  let ok = true;
  for (const room of rooms) {
    const r = await svc.createBlock(room, str(fd, "from"), str(fd, "to"), str(fd, "note"));
    ok &&= r.ok;
    msgs.push(r.message);
  }
  back("/admin/obsazenost", { ok, message: [...new Set(msgs)].join(" ") });
}

export async function removeBlock(fd: FormData) {
  await requireAdmin();
  back("/admin/obsazenost", await svc.deleteBlock(str(fd, "id")));
}

// ---------- Nastavení a ceník ----------

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const cur = await getSettings();
  const iban = normalizeIban(str(fd, "iban"));
  if (iban && !isValidIban(iban)) back("/admin/nastaveni", { ok: false, message: "IBAN není platný – zkontrolujte ho prosím." });

  const seasons: Season[] = [];
  const names = fd.getAll("season_name").map(String);
  names.forEach((name, i) => {
    const from = String(fd.getAll("season_from")[i] ?? "").trim();
    const to = String(fd.getAll("season_to")[i] ?? "").trim();
    const pct = Number(fd.getAll("season_pct")[i] ?? 0);
    if (name.trim() && /^\d{2}-\d{2}$/.test(from) && /^\d{2}-\d{2}$/.test(to)) {
      seasons.push({ id: newId(), name: name.trim(), from, to, surchargePercent: Number.isFinite(pct) ? Math.round(pct) : 0 });
    }
  });

  const room = (id: RoomId) => ({
    active: bool(fd, `${id}_active`),
    basePrice: num(fd, `${id}_basePrice`),
    includedGuests: num(fd, `${id}_includedGuests`, 1, 10),
    maxGuests: num(fd, `${id}_maxGuests`, 1, 10),
    extraPersonPrice: num(fd, `${id}_extraPersonPrice`),
    extraBedAvailable: bool(fd, `${id}_extraBedAvailable`),
    extraBedPrice: num(fd, `${id}_extraBedPrice`),
  });

  const next: Settings = {
    ...cur,
    name: str(fd, "name") || cur.name,
    tagline: { cs: str(fd, "tagline_cs"), en: str(fd, "tagline_en"), de: str(fd, "tagline_de") },
    address: str(fd, "address"),
    municipality: str(fd, "municipality"),
    ...parseGps(str(fd, "gps"), cur),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    iban,
    accountName: str(fd, "accountName"),
    checkIn: str(fd, "checkIn") || "15:00",
    checkOut: str(fd, "checkOut") || "10:00",
    petsAllowed: bool(fd, "petsAllowed"),
    petsNote: { cs: str(fd, "petsNote_cs"), en: str(fd, "petsNote_en"), de: str(fd, "petsNote_de") },
    minNights: num(fd, "minNights", 1, 30),
    cleaningFee: num(fd, "cleaningFee"),
    cityTax: num(fd, "cityTax", 0, 1000),
    cityTaxChildrenExempt: bool(fd, "cityTaxChildrenExempt"),
    weekendSurchargePercent: num(fd, "weekendSurchargePercent", -50, 200),
    seasons,
    rooms: { "pokoj-2": room("pokoj-2"), "pokoj-5": room("pokoj-5") },
    depositPercent: num(fd, "depositPercent", 0, 100),
    paymentDueDays: num(fd, "paymentDueDays", 0, 60),
    holdHours: num(fd, "holdHours", 1, 168),
    cancellationPolicy: { cs: str(fd, "cancel_cs"), en: str(fd, "cancel_en"), de: str(fd, "cancel_de") },
    modes: { inquiry: bool(fd, "mode_inquiry"), instant: bool(fd, "mode_instant") },
  };
  if (!next.modes.inquiry && !next.modes.instant) back("/admin/nastaveni", { ok: false, message: "Alespoň jeden způsob rezervace musí zůstat zapnutý." });
  await (await db()).saveSettings(next);
  revalidatePath("/", "layout");
  back("/admin/nastaveni", { ok: true, message: "Nastavení uloženo." });
}

// ---------- iCal ----------

export async function addIcalImport(fd: FormData) {
  await requireAdmin();
  const s = await getSettings();
  const url = str(fd, "url");
  const roomId = str(fd, "roomId") as RoomId;
  if (!/^https?:\/\//.test(url) || !ROOM_IDS.includes(roomId)) back("/admin/ical", { ok: false, message: "Zadejte platnou adresu a pokoj." });
  s.icalImports = [...s.icalImports, { id: "ical_" + newId(), roomId, name: str(fd, "name") || "Kalendář", url }];
  await (await db()).saveSettings(s);
  const st = await importAllIcal();
  const last = st.results[st.results.length - 1];
  back("/admin/ical", last?.ok ? { ok: true, message: `Přidáno, načteno ${last.nights} obsazených nocí.` } : { ok: false, message: `Přidáno, ale import selhal: ${last?.error}` });
}

export async function removeIcalImportAction(fd: FormData) {
  await requireAdmin();
  const s = await getSettings();
  const imp = s.icalImports.find((i) => i.id === str(fd, "id"));
  if (imp) {
    s.icalImports = s.icalImports.filter((i) => i.id !== imp.id);
    await (await db()).saveSettings(s);
    await removeIcalImport(imp.roomId, imp.id);
  }
  back("/admin/ical", { ok: true, message: "Import odebrán a jeho noci uvolněny." });
}

export async function syncIcalNow() {
  await requireAdmin();
  await svc.expireStaleHolds();
  const st = await importAllIcal();
  const bad = st.results.filter((r) => !r.ok);
  back("/admin/ical", bad.length ? { ok: false, message: `Chyba u: ${bad.map((b) => b.name).join(", ")}` } : { ok: true, message: "Synchronizováno." });
}

export async function regenerateIcalToken() {
  await requireAdmin();
  const s = await getSettings();
  s.icalToken = newId() + newId();
  await (await db()).saveSettings(s);
  back("/admin/ical", { ok: true, message: "Vygenerovány nové adresy. Nezapomeňte je aktualizovat v Bookingu/Airbnb." });
}

/** „49.6899, 14.0104“ (zkopírováno z Mapy.cz / Google Map) → { lat, lng }; při chybě ponechá původní. */
function parseGps(v: string, cur: Settings): { lat: number; lng: number } {
  const m = v.match(/(-?\d{1,2}(?:[.,]\d+)?)\s*°?\s*[NnSs]?\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)/);
  if (!m) return { lat: cur.lat, lng: cur.lng };
  const lat = Number(m[1].replace(",", "."));
  const lng = Number(m[2].replace(",", "."));
  if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return { lat: cur.lat, lng: cur.lng };
  return { lat, lng };
}
