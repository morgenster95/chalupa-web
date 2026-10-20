import type { Metadata } from "next";
import { Sprig } from "@/components/Botanical";
import BookingWidget from "@/components/BookingWidget";
import { todayPrague } from "@/lib/dates";
import { getSettings } from "@/lib/db";
import { getMessages, type Locale } from "@/lib/i18n";
import { instantReady, publicSettings } from "@/lib/public";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getMessages(locale).booking.title };
}

export default async function BookingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();

  return (
    <section className="relative">
      <Sprig name="fern" className="absolute -right-12 top-0 hidden h-[26rem] w-auto rotate-[18deg] text-sage-dark/[0.12] md:block" />
      <div className="container-x relative py-10 md:py-16">
        <p className="eyebrow">{s.name}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{m.booking.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{m.booking.subtitle}</p>
        <div className="mt-10">
          <BookingWidget locale={locale} m={m} s={publicSettings(s)} today={todayPrague()} initialRoom="pokoj-2" stripeReady={instantReady()} />
        </div>
      </div>
    </section>
  );
}
