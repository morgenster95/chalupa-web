import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { firestore } from "../firebase-admin";
import type { Block, Booking, Night, NightKind, RoomId, Settings } from "../types";
import { ConflictError, nightId, type Store } from "./store";

// Kolekce: settings/main, bookings/{id}, nights/{roomId_date}, blocks/{id}, meta/{key}
// Ochrana proti dvojí rezervaci: každá noc pokoje je samostatný dokument s pevným ID.
// Rezervace ho v transakci vytváří – pokud už existuje, transakce selže.

const db = () => firestore();
const CHUNK = 400;

async function lockInTx(roomId: RoomId, dates: string[], kind: NightKind, refId: string, extra?: (t: FirebaseFirestore.Transaction) => void) {
  if (dates.length > CHUNK) throw new Error("Příliš dlouhý interval.");
  await db().runTransaction(async (t) => {
    const refs = dates.map((d) => db().collection("nights").doc(nightId(roomId, d)));
    const snaps = refs.length ? await t.getAll(...refs) : [];
    const taken = snaps.filter((s) => s.exists).map((s) => (s.data() as Night).date);
    if (taken.length) throw new ConflictError(taken);
    refs.forEach((ref, i) => t.create(ref, { roomId, date: dates[i], kind, refId } satisfies Night));
    extra?.(t);
  });
}

export const firestoreStore: Store = {
  async getSettings() {
    const s = await db().doc("settings/main").get();
    return s.exists ? (s.data() as Partial<Settings>) : null;
  },
  async saveSettings(s) {
    await db().doc("settings/main").set(s);
  },

  async getBooking(id) {
    const s = await db().collection("bookings").doc(id).get();
    return s.exists ? (s.data() as Booking) : null;
  },
  async listBookings(limit = 500) {
    const q = await db().collection("bookings").orderBy("createdAt", "desc").limit(limit).get();
    return q.docs.map((d) => d.data() as Booking);
  },
  async findBookingByStripeSession(sid) {
    const q = await db().collection("bookings").where("stripeSessionId", "==", sid).limit(1).get();
    return q.empty ? null : (q.docs[0].data() as Booking);
  },
  async saveBooking(b) {
    await db().collection("bookings").doc(b.id).set(b);
  },
  async createBooking(b, nights) {
    await lockInTx(b.roomId, nights, "booking", b.id, (t) => t.create(db().collection("bookings").doc(b.id), b));
  },
  async listExpiredHolds(now) {
    const q = await db().collection("bookings").where("holdUntil", "<", now).get();
    return q.docs.map((d) => d.data() as Booking);
  },

  lockNights: (roomId, dates, kind, refId) => lockInTx(roomId, dates, kind, refId),
  async releaseNights(roomId, dates, refId) {
    for (let i = 0; i < dates.length; i += CHUNK) {
      const part = dates.slice(i, i + CHUNK);
      await db().runTransaction(async (t) => {
        const refs = part.map((d) => db().collection("nights").doc(nightId(roomId, d)));
        const snaps = await t.getAll(...refs);
        snaps.forEach((s, j) => {
          if (s.exists && (s.data() as Night).refId === refId) t.delete(refs[j]);
        });
      });
    }
  },
  async listNights(roomId, from, to) {
    const q = await db()
      .collection("nights")
      .orderBy(FieldPath.documentId())
      .startAt(nightId(roomId, from))
      .endBefore(nightId(roomId, to))
      .get();
    return q.docs.map((d) => d.data() as Night);
  },

  async listBlocks() {
    const q = await db().collection("blocks").orderBy("from").get();
    return q.docs.map((d) => d.data() as Block);
  },
  async getBlock(id) {
    const s = await db().collection("blocks").doc(id).get();
    return s.exists ? (s.data() as Block) : null;
  },
  async saveBlock(b) {
    await db().collection("blocks").doc(b.id).set(b);
  },
  async deleteBlock(id) {
    await db().collection("blocks").doc(id).delete();
  },

  async replaceIcalNights(roomId, importId, dates) {
    const want = new Set(dates);
    const existing = await db().collection("nights").where("refId", "==", importId).get();
    const have = new Set<string>();
    const del = existing.docs.filter((d) => {
      const n = d.data() as Night;
      have.add(n.date);
      return !want.has(n.date);
    });
    for (let i = 0; i < del.length; i += CHUNK) {
      const batch = db().batch();
      del.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    const toAdd = [...want].filter((d) => !have.has(d));
    const conflicts: string[] = [];
    for (let i = 0; i < toAdd.length; i += CHUNK) {
      const part = toAdd.slice(i, i + CHUNK);
      await db().runTransaction(async (t) => {
        const refs = part.map((d) => db().collection("nights").doc(nightId(roomId, d)));
        const snaps = await t.getAll(...refs);
        snaps.forEach((s, j) => {
          if (s.exists) conflicts.push(part[j]);
          else t.create(refs[j], { roomId, date: part[j], kind: "ical", refId: importId } satisfies Night);
        });
      });
    }
    return { conflicts: conflicts.sort() };
  },

  async getMeta<T>(key: string) {
    const s = await db().collection("meta").doc(key).get();
    return s.exists ? ((s.data() as { value: T }).value ?? null) : null;
  },
  async setMeta(key, value) {
    await db().collection("meta").doc(key).set({ value });
  },
};
