// QR Platba (Short Payment Descriptor, SPAYD) – český standard ČBA.
// https://qr-platba.cz/pro-vyvojare/specifikace-formatu/

export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/** Kontrola IBAN (mod 97). */
export function isValidIban(iban: string): boolean {
  const s = normalizeIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const re = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of re) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

/** Odstraní diakritiku a znaky, které by rozbily formát. */
function clean(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

export interface SpaydInput {
  iban: string;
  amount: number;
  variableSymbol?: string;
  message?: string;
  recipientName?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
}

export function buildSpayd(p: SpaydInput): string {
  const parts = ["SPD", "1.0", `ACC:${normalizeIban(p.iban)}`, `AM:${p.amount.toFixed(2)}`, "CC:CZK"];
  if (p.dueDate) parts.push(`DT:${p.dueDate.replace(/-/g, "")}`);
  if (p.message) parts.push(`MSG:${clean(p.message, 60)}`);
  if (p.recipientName) parts.push(`RN:${clean(p.recipientName, 35)}`);
  if (p.variableSymbol) parts.push(`X-VS:${p.variableSymbol.replace(/\D/g, "").slice(0, 10)}`);
  return parts.join("*");
}

/** Lidsky čitelné číslo účtu z českého IBAN (CZkk BBBB PPPPPP CCCCCCCCCC). */
export function czAccountFromIban(iban: string): string | null {
  const s = normalizeIban(iban);
  if (!s.startsWith("CZ") || s.length !== 24) return null;
  const bank = s.slice(4, 8);
  const prefix = s.slice(8, 14).replace(/^0+/, "");
  const num = s.slice(14).replace(/^0+/, "");
  return `${prefix ? prefix + "-" : ""}${num}/${bank}`;
}
