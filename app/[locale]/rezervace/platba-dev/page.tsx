import { notFound } from "next/navigation";
import { devShortcuts } from "@/lib/config";
import { db } from "@/lib/db";
import { formatRange, getMessages, type Locale } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import { verify } from "@/lib/tokens";

// Náhrada Stripe Checkout pro lokální vývoj (dokud nejsou nastaveny klíče Stripe).
export default async function DevPayment({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ id?: string; t?: string }> }) {
  if (!devShortcuts()) notFound();
  const { locale } = await params;
  const { id = "", t = "" } = await searchParams;
  if (!verify("view", id, t)) notFound();
  const b = await (await db()).getBooking(id);
  if (!b) notFound();
  const m = getMessages(locale);
  return (
    <section className="container-x max-w-lg py-16">
      <div className="card p-8">
        <p className="inline-block rounded-full bg-honey-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-honey-dark">Testovací platba</p>
        <h1 className="mt-4 text-3xl">Simulace Stripe</h1>
        <p className="mt-2 text-muted">
          Stripe zatím není nastaven, takže platbu jen simulujeme. Po nastavení klíčů tu bude skutečná platební brána Stripe (karta, Apple Pay, Google Pay).
        </p>
        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{m.booking.room}</dt>
            <dd>{m.rooms[b.roomId].name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{m.booking.dates}</dt>
            <dd>{formatRange(b.from, b.to, locale)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>{m.booking.total}</dt>
            <dd>{formatCzk(b.price.total, locale)}</dd>
          </div>
        </dl>
        <form action="/api/dev/pay" method="post" className="mt-6">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="t" value={t} />
          <button className="btn-primary w-full">Zaplatit {formatCzk(b.price.total, locale)} (simulace)</button>
        </form>
        <a href={`/api/bookings/${id}/payment-cancelled?t=${t}`} className="btn-secondary mt-3 w-full">
          Zrušit platbu
        </a>
      </div>
    </section>
  );
}
