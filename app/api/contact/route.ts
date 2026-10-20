import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, looksLikeBot, rateLimit, verifyTurnstile } from "@/lib/antispam";
import { ownerEmailOverride } from "@/lib/config";
import { getSettings } from "@/lib/db";
import { sendMail } from "@/lib/email/send";
import { ownerContact } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(""),
  message: z.string().trim().min(5).max(5000),
  locale: z.string().max(5).default("cs"),
});

const LINKS = /(https?:\/\/|www\.)/gi;

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 30 * 60_000)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "form" }, { status: 400 });
  }
  if (looksLikeBot(body.website, body.startedAt)) return NextResponse.json({ ok: false, error: "spam" }, { status: 400 });
  if (!(await verifyTurnstile(body.turnstile as string | undefined, ip))) return NextResponse.json({ ok: false, error: "spam" }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "form" }, { status: 400 });
  // zprávy plné odkazů jsou téměř vždy spam
  if ((parsed.data.message.match(LINKS) ?? []).length > 3) return NextResponse.json({ ok: false, error: "spam" }, { status: 400 });

  const s = await getSettings();
  const mail = ownerContact(s, parsed.data);
  await sendMail({ to: ownerEmailOverride() || s.email, subject: mail.subject, html: mail.html, replyTo: parsed.data.email }, s.name);
  return NextResponse.json({ ok: true });
}
