import "server-only";
import { z } from "zod";
import { devShortcuts, ownerEmailOverride, siteUrl, stripeEnabled } from "./config";
import { addDays, isIsoDate, nightsBetween, todayPrague } from "./dates";
import { ConflictError, db, getSettings } from "./db";
import { sendMail } from "./email/send";
import * as tpl from "./email/templates";
import { computeDue } from "./payments";
import { calculatePrice, validateStay, type StayError } from "./pricing";
import { CHECKOUT_MINUTES, createCheckout, stripe } from "./stripe";
import { newId, newVariableSymbol, sign } from "./tokens";
import { LOCALES, ROOM_IDS, type Booking, type BookingStatus, type Settings } from "./types";

export const bookingInput = z.object({
  roomId: z.enum(ROOM_IDS),
  from: z.string().refine(isIsoDate),
  to: z.string().refine(isIsoDate),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10),
  extraBed: z.boolean(),
  mode: z.enum(["inquiry", "instant"]),
  locale: z.enum(LOCALES),
  guest: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(40),
    note: z.string().trim().max(2000).default(""),
  }),
});
export type BookingInput = z.infer<typeof bookingInput>;

export type CreateResult =
  | { ok: true; redirect: string }
  | { ok: false; error: StayError | "conflict" | "past" | "mode" | "server"; dates?: string[] };

const now = () => new Date().toISOString();
const ACTIVE: BookingStatus[] = ["pending", "awaiting_payment", "confirmed"];

function ownerEmail(s: Settings) {
  return ownerEmailOverride() || s.email;
}

async function mailGuest(b: Booking, s: Settings, m: { subject: string; html: string }) {
  await sendMail({ to: b.guest.email, subject: m.subject, html: m.html, replyTo: ownerEmail(s) }, s.name);
}
async function mailOwner(s: Settings, m: { subject: string; html: string }, replyTo?: string) {
  await sendMail({ to: ownerEmail(s), subject: m.subject, html: m.html, replyTo }, s.name);
}

function log(b: Booking, action: string, by = "system") {
  b.history = [...(b.history ?? []), { at: now(), action, by }];
  b.updatedAt = now();
}

/** Uvolní propadlé blokace (nepotvrzené poptávky, nezaplacené platby). */
export async function expireStaleHolds(): Promise<number> {
  const store = await db();
  const list = await store.listExpiredHolds(now());
  let n = 0;
  for (const b of list) {
    if (b.status === "pending" || b.status === "awaiting_payment") {
      b.status = "expired";
      b.holdUntil = null;
      log(b, "Platnost blokace vypršela");
      await store.saveBooking(b);
      await store.releaseNights(b.roomId, nightsBetween(b.from, b.to), b.id);
      n++;
    } else {
      b.holdUntil = null;
      await store.saveBooking(b);
    }
  }
  return n;
}

export async function createBooking(input: BookingInput): Promise<CreateResult> {
  const s = await getSettings();
  if (!s.modes[input.mode]) return { ok: false, error: "mode" };
  const err = validateStay(s, input);
  if (err) return { ok: false, error: err };
  if (input.from < todayPrague()) return { ok: false, error: "past" };

  await expireStaleHolds();
  const store = await db();
  const price = calculatePrice(s, input);
  const hold = input.mode === "inquiry" ? s.holdHours * 3600_000 : (CHECKOUT_MINUTES + 4) * 60_000;
  const b: Booking = {
    id: newId(),
    roomId: input.roomId,
    from: input.from,
    to: input.to,
    adults: input.adults,
    children: input.children,
    extraBed: input.extraBed,
    guest: { ...input.guest, note: input.guest.note ?? "" },
    locale: input.locale,
    mode: input.mode,
    price: input.mode === "instant" ? { ...price, deposit: price.total } : price,
    status: input.mode === "inquiry" ? "pending" : "awaiting_payment",
    paymentStatus: "unpaid",
    holdUntil: new Date(Date.now() + hold).toISOString(),
    paymentDue: null,
    variableSymbol: newVariableSymbol(),
    stripeSessionId: null,
    createdAt: now(),
    updatedAt: now(),
    history: [{ at: now(), action: input.mode === "inquiry" ? "Vytvořena poptávka" : "Zahájena platba kartou", by: "host" }],
  };

  try {
    await store.createBooking(b, nightsBetween(b.from, b.to));
  } catch (e) {
    if (e instanceof ConflictError) return { ok: false, error: "conflict", dates: e.dates };
    console.error(e);
    return { ok: false, error: "server" };
  }

  const t = sign("view", b.id);
  if (b.mode === "inquiry") {
    await Promise.all([mailOwner(s, tpl.ownerInquiry(b, s), b.guest.email), mailGuest(b, s, tpl.guestInquiryReceived(b, s))]);
    return { ok: true, redirect: `/${b.locale}/rezervace/hotovo?id=${b.id}&t=${t}` };
  }

  // Okamžitá rezervace → Stripe Checkout
  if (!stripeEnabled()) {
    if (devShortcuts()) return { ok: true, redirect: `/${b.locale}/rezervace/platba-dev?id=${b.id}&t=${t}` };
    await releaseAndSet(b, "cancelled", "Stripe není nastaven");
    return { ok: false, error: "mode" };
  }
  try {
    const session = await createCheckout(b, s);
    b.stripeSessionId = session.id;
    await store.saveBooking(b);
    return { ok: true, redirect: session.url };
  } catch (e) {
    console.error("Stripe checkout selhal", e);
    await releaseAndSet(b, "cancelled", "Chyba při vytvoření platby");
    return { ok: false, error: "server" };
  }
}

async function releaseAndSet(b: Booking, status: BookingStatus, action: string, by = "system") {
  const store = await db();
  b.status = status;
  b.holdUntil = null;
  log(b, action, by);
  await store.saveBooking(b);
  await store.releaseNights(b.roomId, nightsBetween(b.from, b.to), b.id);
}

/** Znovu zablokuje noci (např. když majitel potvrzuje poptávku po vypršení). */
async function relock(b: Booking): Promise<boolean> {
  try {
    await (await db()).lockNights(b.roomId, nightsBetween(b.from, b.to), "booking", b.id);
    return true;
  } catch (e) {
    if (e instanceof ConflictError) return false;
    throw e;
  }
}

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function confirmInquiry(id: string, by: string): Promise<ActionResult> {
  const store = await db();
  const s = await getSettings();
  const b = await store.getBooking(id);
  if (!b) return { ok: false, message: "Rezervace neexistuje." };
  if (b.status === "confirmed") return { ok: true, message: "Rezervace už je potvrzená." };
  if (b.status === "expired" || b.status === "declined") {
    if (!(await relock(b))) return { ok: false, message: "Termín už mezitím obsadil někdo jiný – nelze potvrdit." };
  } else if (b.status !== "pending") {
    return { ok: false, message: `Rezervaci ve stavu „${b.status}“ nelze potvrdit.` };
  }
  b.status = "confirmed";
  b.holdUntil = null;
  b.paymentDue = computeDue(todayPrague(), s.paymentDueDays, b.from);
  log(b, "Potvrzeno majitelem", by);
  await store.saveBooking(b);
  await mailGuest(b, s, tpl.guestConfirmedTransfer(b, s));
  return { ok: true, message: "Potvrzeno. Host dostal e-mail s QR platbou." };
}

export async function declineInquiry(id: string, by: string): Promise<ActionResult> {
  const store = await db();
  const s = await getSettings();
  const b = await store.getBooking(id);
  if (!b) return { ok: false, message: "Rezervace neexistuje." };
  if (b.status === "declined") return { ok: true, message: "Poptávka už byla odmítnuta." };
  if (b.status !== "pending" && b.status !== "expired") return { ok: false, message: `Rezervaci ve stavu „${b.status}“ nelze odmítnout – použijte Zrušit.` };
  await releaseAndSet(b, "declined", "Odmítnuto majitelem", by);
  await mailGuest(b, s, tpl.guestDeclined(b, s));
  return { ok: true, message: "Odmítnuto. Host dostal e-mail a termín je opět volný." };
}

export async function cancelBooking(id: string, by: string, notify: boolean): Promise<ActionResult> {
  const store = await db();
  const s = await getSettings();
  const b = await store.getBooking(id);
  if (!b) return { ok: false, message: "Rezervace neexistuje." };
  if (!ACTIVE.includes(b.status) && b.status !== "conflict") return { ok: false, message: "Rezervace není aktivní." };
  if (b.status === "awaiting_payment" && b.stripeSessionId && stripeEnabled()) {
    await stripe().checkout.sessions.expire(b.stripeSessionId).catch(() => undefined);
  }
  await releaseAndSet(b, "cancelled", "Zrušeno", by);
  if (notify) await mailGuest(b, s, tpl.guestCancelled(b, s));
  return { ok: true, message: "Rezervace zrušena, termín je volný." + (b.paymentStatus !== "unpaid" ? " Nezapomeňte případně vrátit platbu." : "") };
}

export async function setPaymentStatus(id: string, status: Booking["paymentStatus"], by: string): Promise<ActionResult> {
  const store = await db();
  const b = await store.getBooking(id);
  if (!b) return { ok: false, message: "Rezervace neexistuje." };
  b.paymentStatus = status;
  log(b, `Platba: ${status}`, by);
  await store.saveBooking(b);
  return { ok: true, message: "Stav platby uložen." };
}

/** Úspěšná platba (Stripe webhook nebo vývojová simulace). Idempotentní. */
export async function markInstantPaid(id: string, source: string): Promise<Booking | null> {
  const store = await db();
  const s = await getSettings();
  const b = await store.getBooking(id);
  if (!b) return null;
  if (b.paymentStatus === "paid") return b;
  if (b.status === "awaiting_payment") {
    b.status = "confirmed";
  } else if (b.status === "expired" || b.status === "cancelled") {
    b.status = (await relock(b)) ? "confirmed" : "conflict";
  }
  b.paymentStatus = "paid";
  b.holdUntil = null;
  log(b, `Zaplaceno (${source})`);
  await store.saveBooking(b);
  if (b.status === "confirmed") {
    await Promise.all([mailGuest(b, s, tpl.guestPaid(b, s)), mailOwner(s, tpl.ownerPaid(b, s), b.guest.email)]);
  } else {
    await mailOwner(s, tpl.ownerConflict(b, s), b.guest.email);
  }
  return b;
}

/** Host platbu zrušil / session vypršela – uvolnit termín. */
export async function cancelPendingPayment(id: string, reason: string): Promise<void> {
  const store = await db();
  const b = await store.getBooking(id);
  if (!b || b.status !== "awaiting_payment") return;
  if (b.stripeSessionId && stripeEnabled() && reason !== "Platební relace vypršela") {
    try {
      const sess = await stripe().checkout.sessions.retrieve(b.stripeSessionId);
      if (sess.payment_status === "paid") return; // mezitím zaplaceno – vyřeší webhook
      if (sess.status === "open") await stripe().checkout.sessions.expire(b.stripeSessionId);
    } catch (e) {
      console.error(e);
    }
  }
  await releaseAndSet(b, "expired", reason);
}

/** Ruční blokace termínu v administraci. */
export async function createBlock(roomId: Booking["roomId"], from: string, to: string, note: string): Promise<ActionResult> {
  if (!isIsoDate(from) || !isIsoDate(to) || to <= from) return { ok: false, message: "Neplatný termín." };
  if (nightsBetween(from, to).length > 400) return { ok: false, message: "Maximálně 400 nocí najednou." };
  const store = await db();
  const id = newId();
  try {
    await store.lockNights(roomId, nightsBetween(from, to), "block", id);
  } catch (e) {
    if (e instanceof ConflictError) return { ok: false, message: `V termínu už je obsazeno: ${e.dates.slice(0, 5).join(", ")}${e.dates.length > 5 ? "…" : ""}` };
    throw e;
  }
  await store.saveBlock({ id, roomId, from, to, note, createdAt: now() });
  return { ok: true, message: "Termín zablokován." };
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const store = await db();
  const bl = await store.getBlock(id);
  if (!bl) return { ok: false, message: "Blokace neexistuje." };
  await store.releaseNights(bl.roomId, nightsBetween(bl.from, bl.to), bl.id);
  await store.deleteBlock(id);
  return { ok: true, message: "Blokace odstraněna." };
}

/** Obsazené noci pro veřejný kalendář (bez detailů). */
export async function busyNights(roomId: Booking["roomId"], months = 18): Promise<string[]> {
  await expireStaleHolds().catch((e) => console.error(e));
  const from = todayPrague();
  const to = addDays(from, months * 31);
  const nights = await (await db()).listNights(roomId, from, to);
  return nights.map((n) => n.date);
}

export function publicBookingUrl(b: Booking) {
  return `${siteUrl()}/${b.locale}/rezervace/hotovo?id=${b.id}&t=${sign("view", b.id)}`;
}
