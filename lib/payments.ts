import { addDays } from "./dates.ts";
import type { Booking } from "./types.ts";

/** Kolik má host aktuálně zaplatit převodem. */
export function amountDue(b: Booking): number {
  if (b.paymentStatus === "paid" || b.paymentStatus === "refunded") return 0;
  if (b.paymentStatus === "deposit_paid") return b.price.total - b.price.deposit;
  return b.price.deposit;
}

export function isDepositStage(b: Booking): boolean {
  return b.paymentStatus === "unpaid" && b.price.deposit < b.price.total;
}

/** Splatnost: X dní od potvrzení, ale nejpozději den před příjezdem (a ne v minulosti). */
export function computeDue(today: string, days: number, arrival: string): string {
  const due = addDays(today, Math.max(0, days));
  const latest = addDays(arrival, -1);
  if (latest < today) return today;
  return due < latest ? due : latest;
}
