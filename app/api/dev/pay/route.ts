import { NextResponse } from "next/server";
import { markInstantPaid } from "@/lib/booking";
import { devShortcuts } from "@/lib/config";
import { verify } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Pouze pro lokální vývoj bez Stripe: simulace úspěšné platby.
export async function POST(req: Request) {
  if (!devShortcuts()) return NextResponse.json({ error: "disabled" }, { status: 404 });
  const form = await req.formData();
  const id = String(form.get("id") || "");
  const t = String(form.get("t") || "");
  if (!verify("view", id, t)) return NextResponse.json({ error: "token" }, { status: 403 });
  const b = await markInstantPaid(id, "simulace");
  return NextResponse.redirect(new URL(`/${b?.locale ?? "cs"}/rezervace/hotovo?id=${id}&t=${t}&paid=1`, req.url), 303);
}
