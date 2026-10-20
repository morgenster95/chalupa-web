import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingWidget from "@/components/BookingWidget";
import Gallery from "@/components/Gallery";
import Icon from "@/components/Icon";
import { todayPrague } from "@/lib/dates";
import { getSettings } from "@/lib/db";
import { getMessages, nightsLabel, t, type Locale } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import { instantReady, publicSettings } from "@/lib/public";
import { ROOM_LIST, roomBySlug } from "@/lib/rooms";

export function generateStaticParams() {
  return ROOM_LIST.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const room = roomBySlug(slug);
  if (!room) return {};
  const m = getMessages(locale);
  return { title: m.rooms[room.id].name, description: m.rooms[room.id].short, openGraph: { images: [room.cover.src] } };
}

export default async function RoomPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const room = roomBySlug(slug);
  if (!room) notFound();
  const m = getMessages(locale);
  const s = await getSettings();
  const r = s.rooms[room.id];
  const text = m.rooms[room.id];

  const priceRows: [string, string][] = [
    [`${m.rooms.priceBase} (${t(m.rooms.priceIncluded, { n: r.includedGuests })})`, formatCzk(r.basePrice, locale)],
    ...(r.extraPersonPrice > 0 && r.maxGuests > r.includedGuests ? ([[m.rooms.priceExtraPerson, `${formatCzk(r.extraPersonPrice, locale)} ${m.rooms.perNight}`]] as [string, string][]) : []),
    ...(r.extraBedAvailable ? ([[m.rooms.priceExtraBed, `${formatCzk(r.extraBedPrice, locale)} ${m.rooms.perNight}`]] as [string, string][]) : []),
    ...(s.cleaningFee > 0 ? ([[m.rooms.priceCleaning, formatCzk(s.cleaningFee, locale)]] as [string, string][]) : []),
    ...(s.cityTax > 0
      ? ([[`${m.rooms.priceTax} ${s.cityTaxChildrenExempt ? m.rooms.priceTaxChildren : ""}`, `${formatCzk(s.cityTax, locale)} ${m.rooms.priceTaxUnit}`]] as [string, string][])
      : []),
    [m.rooms.priceMinNights, nightsLabel(s.minNights, m)],
  ];

  return (
    <>
      <section className="container-x pb-6 pt-8 md:pt-12">
        <Link href={`/${locale}#pokoje`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-wood">
          <Icon name="chevronLeft" className="h-4 w-4" /> {m.nav.rooms}
        </Link>
        <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl">{text.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-sage-dark">
          <Icon name="users" className="h-5 w-5" />
          {t(r.maxGuests >= 5 ? m.rooms.upTo5 : m.rooms.upTo, { n: r.maxGuests })}
          {r.extraBedAvailable && ` ${m.rooms.extraBed}`}
        </p>
        <div className="mt-8">
          <Gallery photos={room.photos} variant="room" />
        </div>
      </section>

      <section className="container-x grid gap-10 py-10 md:grid-cols-[1.4fr_1fr] md:py-14">
        <div>
          <p className="text-lg leading-relaxed text-muted">{text.description}</p>
          <h2 className="mt-10 text-3xl">{m.rooms.features}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {text.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-light text-sage-dark">
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="card h-fit p-6 sm:p-7">
          <h2 className="text-2xl">{m.rooms.prices}</h2>
          <dl className="mt-4 divide-y divide-line text-[0.95rem]">
            {priceRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="whitespace-nowrap text-right font-semibold text-wood">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">{m.rooms.priceSeasonNote}</p>
          <a href="#rezervace" className="btn-primary mt-5 w-full">
            {m.rooms.bookThis}
          </a>
        </aside>
      </section>

      <section id="rezervace" className="scroll-mt-20 bg-cream/60 py-12 md:py-16">
        <div className="container-x">
          <h2 className="mb-8 text-3xl sm:text-4xl">{m.booking.title}</h2>
          <BookingWidget locale={locale} m={m} s={publicSettings(s)} today={todayPrague()} initialRoom={room.id} lockRoom stripeReady={instantReady()} />
        </div>
      </section>
    </>
  );
}
