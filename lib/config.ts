import "server-only";

export const isProd = process.env.NODE_ENV === "production";

/** Statický náhled (GitHub Pages) – bez serveru a databáze. */
export const isStaticPreview = process.env.STATIC_EXPORT === "1";

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Firestore používáme, pokud běžíme na Firebase App Hosting nebo je k dispozici servisní účet. */
export function firestoreEnabled(): boolean {
  if (process.env.DATA_BACKEND === "local") return false;
  if (process.env.DATA_BACKEND === "firestore") return true;
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG);
}

export function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 16) return s;
  if (isProd) throw new Error("APP_SECRET musí být nastaven (min. 16 znaků).");
  return "dev-secret-not-for-production";
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Kam chodí e-maily pro majitele (fallback na e-mail z nastavení). */
export function ownerEmailOverride(): string | null {
  return process.env.OWNER_EMAIL || null;
}

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
export const resendEnabled = () => Boolean(process.env.RESEND_API_KEY);
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

/** Vývojářské zkratky (simulace platby, přihlášení bez Google) – jen mimo produkci a bez Firebase. */
export const devShortcuts = () => !isProd && !firestoreEnabled();
