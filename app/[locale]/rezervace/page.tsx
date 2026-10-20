import type { Metadata } from "next";
import BookingWidget from "@/components/BookingWidget";
import { todayPrague } from "@/lib/dates";
import { getSettings } from "@/lib/db";
import { getMessages, type Locale } from "@/lib/i18n";
import { instantReady, publicSettings } from "@/lib/public";
import { ROOM_IDS, type RoomId } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getMessages(locale).booking.title };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ pokoj?: string }>;
}) {
  const { locale } = await params;
  const { pokoj } = await searchParams;
  const m = getMessages(locale);
  const s = await getSettings();
  const initial = (ROOM_IDS as readonly string[]).includes(pokoj ?? "") ? (pokoj as RoomId) : "pokoj-2";

  return (
    <section className="grain">
      <div className="container-x py-10 md:py-16">
        <p className="eyebrow">{s.name}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{m.booking.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{m.booking.subtitle}</p>
        <div className="mt-10">
          <BookingWidget locale={locale} m={m} s={publicSettings(s)} today={todayPrague()} initialRoom={initial} stripeReady={instantReady()} />
        </div>
      </div>
    </section>
  );
}
