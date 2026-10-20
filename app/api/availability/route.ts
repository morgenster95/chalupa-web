import { NextResponse } from "next/server";
import { busyNights } from "@/lib/booking";
import { ROOM_IDS, type RoomId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const room = new URL(req.url).searchParams.get("room") as RoomId | null;
  if (!room || !ROOM_IDS.includes(room)) return NextResponse.json({ error: "room" }, { status: 400 });
  const busy = await busyNights(room);
  return NextResponse.json({ busy }, { headers: { "Cache-Control": "no-store" } });
}
