import { NextResponse } from "next/server";
import { cancelPendingPayment } from "@/lib/booking";
import { db } from "@/lib/db";
import { verify } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Sem Stripe přesměruje hosta, když platbu zruší. Termín uvolníme a ukážeme stav.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = new URL(req.url).searchParams.get("t");
  if (!verify("view", id, t)) return NextResponse.json({ error: "token" }, { status: 403 });
  await cancelPendingPayment(id, "Host zrušil platbu");
  const b = await (await db()).getBooking(id);
  const locale = b?.locale ?? "cs";
  return NextResponse.redirect(new URL(`/${locale}/rezervace/hotovo?id=${id}&t=${t}&cancelled=1`, req.url), 303);
}
