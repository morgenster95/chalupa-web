import "server-only";
import { turnstileEnabled } from "./config";

const hits = new Map<string, number[]>();

/** Jednoduchý limit požadavků v paměti (best-effort, na instanci serveru). */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const t = Date.now();
  const list = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(t);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

/** Ověření Cloudflare Turnstile (pokud je nastaveno). */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
    });
    const j = (await res.json()) as { success: boolean };
    return j.success;
  } catch {
    return false;
  }
}

/**
 * Základní ochrana formulářů: skryté pole (honeypot) musí zůstat prázdné
 * a formulář nesmí být odeslán dřív než 3 s po načtení.
 */
export function looksLikeBot(honeypot: unknown, startedAt: unknown): boolean {
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  const t = Number(startedAt);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t < 3000;
}
