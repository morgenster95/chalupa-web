import { NextResponse } from "next/server";
import { clientIp, looksLikeBot, rateLimit } from "@/lib/antispam";
import { bookingInput, createBooking } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`booking:${ip}`, 8, 10 * 60_000)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "form" }, { status: 400 });
  }
  if (looksLikeBot(body.website, body.startedAt)) return NextResponse.json({ ok: false, error: "spam" }, { status: 400 });

  const parsed = bookingInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "form", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  try {
    const result = await createBooking(parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : result.error === "conflict" ? 409 : 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
