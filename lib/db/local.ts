import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Block, Booking, Night, Settings } from "../types";
import { ConflictError, nightId, type Store } from "./store";

// Jednoduché úložiště v JSON souboru – jen pro lokální vývoj a náhled.
// V produkci se používá Firestore (lib/db/firestore.ts).

interface Data {
  settings: Partial<Settings> | null;
  bookings: Record<string, Booking>;
  nights: Record<string, Night>;
  blocks: Record<string, Block>;
  meta: Record<string, unknown>;
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

const g = globalThis as unknown as { __chalupaLock?: Promise<unknown> };

async function load(): Promise<Data> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Data;
  } catch {
    return { settings: null, bookings: {}, nights: {}, blocks: {}, meta: {} };
  }
}

async function save(d: Data) {
  await mkdir(DIR, { recursive: true });
  const tmp = FILE + "." + process.pid + ".tmp";
  await writeFile(tmp, JSON.stringify(d, null, 2));
  await rename(tmp, FILE);
}

/** Všechny operace jdou za sebou (mutex), takže se chovají jako transakce. */
function tx<T>(fn: (d: Data) => T | Promise<T>, write = true): Promise<T> {
  const run = async () => {
    const d = await load();
    const r = await fn(d);
    if (write) await save(d);
    return r;
  };
  const p = (g.__chalupaLock ?? Promise.resolve()).then(run, run);
  g.__chalupaLock = p.catch(() => undefined);
  return p;
}

const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

function lock(d: Data, roomId: Night["roomId"], dates: string[], kind: Night["kind"], refId: string) {
  const taken = dates.filter((x) => d.nights[nightId(roomId, x)]);
  if (taken.length) throw new ConflictError(taken);
  for (const date of dates) d.nights[nightId(roomId, date)] = { roomId, date, kind, refId };
}

export const localStore: Store = {
  getSettings: () => tx((d) => clone(d.settings), false),
  saveSettings: (s) => tx((d) => void (d.settings = clone(s))),

  getBooking: (id) => tx((d) => clone(d.bookings[id] ?? null), false),
  listBookings: (limit = 500) =>
    tx(
      (d) =>
        clone(Object.values(d.bookings))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit),
      false,
    ),
  findBookingByStripeSession: (sid) =>
    tx((d) => clone(Object.values(d.bookings).find((b) => b.stripeSessionId === sid) ?? null), false),
  saveBooking: (b) => tx((d) => void (d.bookings[b.id] = clone(b))),
  createBooking: (b, nights) =>
    tx((d) => {
      lock(d, b.roomId, nights, "booking", b.id);
      d.bookings[b.id] = clone(b);
    }),
  listExpiredHolds: (now) =>
    tx((d) => clone(Object.values(d.bookings).filter((b) => b.holdUntil && b.holdUntil < now)), false),

  lockNights: (roomId, dates, kind, refId) => tx((d) => lock(d, roomId, dates, kind, refId)),
  releaseNights: (roomId, dates, refId) =>
    tx((d) => {
      for (const date of dates) {
        const id = nightId(roomId, date);
        if (d.nights[id]?.refId === refId) delete d.nights[id];
      }
    }),
  listNights: (roomId, from, to) =>
    tx(
      (d) =>
        clone(Object.values(d.nights).filter((n) => n.roomId === roomId && n.date >= from && n.date < to)).sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
      false,
    ),

  listBlocks: () => tx((d) => clone(Object.values(d.blocks)).sort((a, b) => a.from.localeCompare(b.from)), false),
  getBlock: (id) => tx((d) => clone(d.blocks[id] ?? null), false),
  saveBlock: (b) => tx((d) => void (d.blocks[b.id] = clone(b))),
  deleteBlock: (id) => tx((d) => void delete d.blocks[id]),

  replaceIcalNights: (roomId, importId, dates) =>
    tx((d) => {
      const want = new Set(dates);
      for (const [id, n] of Object.entries(d.nights)) {
        if (n.kind === "ical" && n.refId === importId && !want.has(n.date)) delete d.nights[id];
      }
      const conflicts: string[] = [];
      for (const date of want) {
        const id = nightId(roomId, date);
        const ex = d.nights[id];
        if (!ex) d.nights[id] = { roomId, date, kind: "ical", refId: importId };
        else if (ex.refId !== importId) conflicts.push(date);
      }
      return { conflicts: conflicts.sort() };
    }),

  getMeta: <T,>(key: string) => tx((d) => clone((d.meta[key] as T) ?? null), false),
  setMeta: (key, value) => tx((d) => void (d.meta[key] = clone(value))),
};

// --- Vývojová „pošta“: e-maily se v lokálním režimu ukládají sem ---
export interface OutboxMail {
  id: string;
  at: string;
  to: string;
  subject: string;
  html: string;
}

export function saveOutbox(mail: OutboxMail) {
  return tx((d) => {
    const list = ((d.meta.outbox as OutboxMail[]) ?? []).slice(-49);
    list.push(mail);
    d.meta.outbox = list;
  });
}

export function listOutbox(): Promise<OutboxMail[]> {
  return tx((d) => clone(((d.meta.outbox as OutboxMail[]) ?? []).slice().reverse()), false);
}
