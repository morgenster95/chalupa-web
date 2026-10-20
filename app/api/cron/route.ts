import { NextResponse } from "next/server";
import { expireStaleHolds } from "@/lib/booking";
import { importAllIcal } from "@/lib/ical-sync";

export const dynamic = "force-dynamic";

// Volá se pravidelně (Cloud Scheduler, každých 30–60 min):
//   GET /api/cron  s hlavičkou  Authorization: Bearer <CRON_SECRET>
// Uvolní propadlé poptávky a stáhne kalendáře z Bookingu/Airbnb.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const qs = new URL(req.url).searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const expired = await expireStaleHolds();
  const ical = await importAllIcal();
  return NextResponse.json({ expired, ical });
}
