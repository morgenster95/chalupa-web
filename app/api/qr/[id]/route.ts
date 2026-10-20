import QRCode from "qrcode";
import { db, getSettings } from "@/lib/db";
import { amountDue } from "@/lib/payments";
import { buildSpayd } from "@/lib/spayd";
import { verify } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!verify("view", id, new URL(req.url).searchParams.get("t"))) return new Response("Forbidden", { status: 403 });
  const b = await (await db()).getBooking(id);
  if (!b || b.status !== "confirmed") return new Response("Not found", { status: 404 });
  const s = await getSettings();
  const amount = amountDue(b);
  if (amount <= 0) return new Response("Paid", { status: 404 });
  const spayd = buildSpayd({
    iban: s.iban,
    amount,
    variableSymbol: b.variableSymbol,
    message: `${s.name} ${b.from}`,
    recipientName: s.accountName || s.name,
    dueDate: b.paymentDue ?? undefined,
  });
  const png = await QRCode.toBuffer(spayd, { errorCorrectionLevel: "M", margin: 2, width: 480, color: { dark: "#2e2822", light: "#ffffff" } });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300" } });
}
