import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { getMessages, t, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getMessages(locale).terms.title };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();
  const deposit = s.depositPercent > 0 && s.depositPercent < 100;
  const sections: [string, string][] = [
    [`${m.terms.checkIn} / ${m.terms.checkOut}`, `${m.terms.checkIn}: ${s.checkIn} · ${m.terms.checkOut}: ${s.checkOut}`],
    [m.terms.payment, t(deposit ? m.terms.paymentText : m.terms.paymentTextFull, { pct: s.depositPercent, days: s.paymentDueDays })],
    [m.terms.cancellation, s.cancellationPolicy[locale]],
    [m.terms.pets, s.petsNote[locale]],
    [m.terms.privacy, m.terms.privacyText],
  ];
  return (
    <section className="container-x max-w-3xl py-10 md:py-16">
      <h1 className="text-4xl sm:text-5xl">{m.terms.title}</h1>
      <div className="mt-10 space-y-8">
        {sections.map(([h, body]) => (
          <div key={h} className="border-b border-line pb-8 last:border-0">
            <h2 className="text-2xl">{h}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
