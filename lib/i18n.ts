import cs, { type Messages } from "@/messages/cs";
import en from "@/messages/en";
import de from "@/messages/de";
import { LOCALES, type Locale } from "./types";

export { LOCALES };
export type { Locale, Messages };
export const DEFAULT_LOCALE: Locale = "cs";

const dicts: Record<Locale, Messages> = { cs, en, de };

export function isLocale(s: string | undefined | null): s is Locale {
  return !!s && (LOCALES as readonly string[]).includes(s);
}

export function getMessages(locale: string): Messages {
  return dicts[isLocale(locale) ? locale : DEFAULT_LOCALE];
}

/** Nahradí {klíč} v textu. */
export function t(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export const LOCALE_LABELS: Record<Locale, string> = { cs: "Čeština", en: "English", de: "Deutsch" };
export const INTL_LOCALE: Record<Locale, string> = { cs: "cs-CZ", en: "en-GB", de: "de-DE" };

export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "numeric", year: "numeric" }) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: "UTC", ...opts }).format(new Date(iso + "T00:00:00Z"));
}

export function formatRange(from: string, to: string, locale: Locale) {
  return `${formatDate(from, locale)} – ${formatDate(to, locale)}`;
}

/** Správný tvar slova „noc“ (1 noc, 2–4 noci, 5+ nocí). */
export function nightsLabel(n: number, m: Messages): string {
  if (n === 1) return `${n} ${m.booking.nightsOne}`;
  if (n >= 2 && n <= 4) return `${n} ${m.booking.nightsFew}`;
  return `${n} ${m.booking.nightsMany}`;
}
