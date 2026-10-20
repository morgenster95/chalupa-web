import { addDays, todayPrague } from "@/lib/dates";
import { db, getSettings } from "@/lib/db";
import { buildIcal } from "@/lib/ical";
import { icalExportToken } from "@/lib/ical-sync";
import { roomBySlug } from "@/lib/rooms";

export const dynamic = "force-dynamic";

// Export obsazenosti pro Booking.com / Airbnb / Google kalendář:
// /api/ical/pokoj-pro-2.ics?token=...
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const room = roomBySlug(file.replace(/\.ics$/, ""));
  if (!room) return new Response("Not found", { status: 404 });
  const s = await getSettings();
  if (new URL(req.url).searchParams.get("token") !== icalExportToken(s)) return new Response("Forbidden", { status: 403 });

  const from = addDays(todayPrague(), -60);
  const nights = (await (await db()).listNights(room.id, from, addDays(from, 800)))
    .filter((n) => n.kind !== "ical") // importované noci neposíláme zpět
    .map((n) => n.date);
  const body = buildIcal({ calName: `${s.name} – ${room.slug}`, uidDomain: new URL(req.url).hostname, nights, summary: "Obsazeno / Booked" });
  return new Response(body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `inline; filename="${room.slug}.ics"`, "Cache-Control": "no-store" },
  });
}
