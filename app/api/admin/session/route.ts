import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/antispam";
import { devSessionValue, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { adminEmails, devShortcuts, isProd } from "@/lib/config";

export const dynamic = "force-dynamic";

const cookieOpts = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/", maxAge: SESSION_DAYS * 86400 };

// Přihlášení: klient pošle Firebase ID token (po přihlášení Googlem), server vytvoří session cookie.
export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Příliš mnoho pokusů." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { idToken?: string; dev?: boolean };

  if (body.dev) {
    if (!devShortcuts()) return NextResponse.json({ error: "Vývojové přihlášení je vypnuté." }, { status: 403 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, devSessionValue(), cookieOpts);
    return res;
  }

  if (!body.idToken) return NextResponse.json({ error: "Chybí token." }, { status: 400 });
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth().verifyIdToken(body.idToken, true);
    const email = (decoded.email || "").toLowerCase();
    if (!decoded.email_verified || !adminEmails().includes(email)) {
      return NextResponse.json({ error: `Účet ${email} nemá přístup do administrace.` }, { status: 403 });
    }
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Přihlaste se prosím znovu." }, { status: 401 });
    }
    const session = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_DAYS * 86400 * 1000 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, session, cookieOpts);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Přihlášení se nepodařilo ověřit." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
