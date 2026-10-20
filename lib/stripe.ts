import "server-only";
import Stripe from "stripe";
import { siteUrl } from "./config";
import { formatRange, getMessages } from "./i18n";
import { sign } from "./tokens";
import type { Booking, Settings } from "./types";

let client: Stripe | undefined;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY není nastaven.");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Stripe vyžaduje platnost session min. 30 minut. */
export const CHECKOUT_MINUTES = 31;

export async function createCheckout(b: Booking, s: Settings): Promise<{ id: string; url: string }> {
  const m = getMessages(b.locale);
  const t = sign("view", b.id);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    locale: b.locale,
    customer_email: b.guest.email,
    client_reference_id: b.id,
    metadata: { bookingId: b.id },
    payment_intent_data: { metadata: { bookingId: b.id }, description: `${s.name} – ${b.variableSymbol}` },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "czk",
          unit_amount: Math.round(b.price.total * 100),
          product_data: {
            name: `${s.name}: ${m.rooms[b.roomId].name}`,
            description: `${formatRange(b.from, b.to, b.locale)} · ${b.price.nights} × ${m.booking.nightsOne}`,
          },
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60,
    success_url: `${siteUrl()}/${b.locale}/rezervace/hotovo?id=${b.id}&t=${t}&paid=1`,
    cancel_url: `${siteUrl()}/api/bookings/${b.id}/payment-cancelled?t=${t}`,
  });
  if (!session.url) throw new Error("Stripe nevrátil URL platby.");
  return { id: session.id, url: session.url };
}
