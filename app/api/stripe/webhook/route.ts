import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelPendingPayment, markInstantPaid } from "@/lib/booking";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "not configured" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("Neplatný podpis Stripe webhooku", e);
    return NextResponse.json({ error: "signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.metadata?.bookingId || session.client_reference_id;
      if (id && session.payment_status === "paid") await markInstantPaid(id, "Stripe");
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const id = session.metadata?.bookingId || session.client_reference_id;
      if (id) await cancelPendingPayment(id, "Platební relace vypršela");
    }
  } catch (e) {
    console.error("Chyba při zpracování webhooku", e);
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
