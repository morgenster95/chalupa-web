import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { appSecret } from "./config";

export function sign(purpose: string, id: string): string {
  return createHmac("sha256", appSecret()).update(`${purpose}:${id}`).digest("base64url").slice(0, 32);
}

export function verify(purpose: string, id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(sign(purpose, id));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newId(): string {
  return randomBytes(9).toString("base64url");
}

/** Variabilní symbol: RR + 6 náhodných číslic (8 číslic celkem). */
export function newVariableSymbol(now = new Date()): string {
  return String(now.getFullYear() % 100).padStart(2, "0") + String(randomInt(0, 1_000_000)).padStart(6, "0");
}
