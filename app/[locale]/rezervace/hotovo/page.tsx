import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import Icon from "@/components/Icon";
import { db, getSettings } from "@/lib/db";
import { formatDate, formatRange, getMessages, nightsLabel, type Locale } from "@/lib/i18n";
import { amountDue } from "@/lib/payments";
import { formatCzk } from "@/lib/pricing";
import { czAccountFromIban, normalizeIban } from "@/lib/spayd";
import { verify } from "@/lib/tokens";

export const metadata: Metadata = { robots: { index: false } };

export default async function DonePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ id?: string; t?: string; paid?: string; cancelled?: string }>;
}) {
  const { locale } = await params;
  const { id = "", t = "", paid, cancelled } = await searchParams;
  if (!verify("view", id, t)) notFound();
  const b = await (await db()).getBooking(id);
  if (!b) notFound();
  const m = getMessages(locale);
  const s = await getSettings();

  let title = m.done.inquiryTitle;
  let text = m.done.inquiryText;
  let tone: "ok" | "wait" | "bad" = "ok";
  let showPayment = false;
  let refresh = false;

  switch (b.status) {
    case "pending":
      break;
    case "awaiting_payment":
      if (paid) {
        title = m.done.waitingTitle;
        text = m.done.waitingText;
        tone = "wait";
        refresh = true;
      } else {
        title = m.done.cancelledTitle;
        text = m.done.cancelledText;
        tone = "bad";
      }
      break;
    case "confirmed":
      if (b.mode === "instant" || b.paymentStatus === "paid") {
        title = m.done.paidTitle;
        text = m.done.paidText;
      } else {
        title = m.done.confirmedTitle;
        text = m.done.confirmedText;
        showPayment = amountDue(b) > 0;
      }
      break;
    case "declined":
      title = m.done.declinedTitle;
      text = m.email.declinedText;
      tone = "bad";
      break;
    case "conflict":
      title = m.done.waitingTitle;
      text = m.errors.conflict;
      tone = "bad";
      break;
    default:
      title = cancelled ? m.done.cancelledTitle : m.done.expiredTitle;
      text = cancelled ? m.done.cancelledText : m.done.expiredText;
      tone = "bad";
  }

  const due = amountDue(b);
  const acc = czAccountFromIban(s.iban);

  return (
    <section className="grain">
      {refresh && <AutoRefresh />}
      <div className="container-x max-w-3xl py-12 md:py-20">
        <div className="card p-6 sm:p-10">
          <span
            className={`grid h-14 w-14 place-items-center rounded-full ${tone === "ok" ? "bg-sage-light text-sage-dark" : tone === "wait" ? "bg-honey-light text-honey-dark" : "bg-[#f7e3dc] text-danger"}`}
          >
            <Icon name={tone === "ok" ? "check" : tone === "wait" ? "clock" : "close"} className="h-7 w-7" strokeWidth={2} />
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">{text}</p>

          <dl className="mt-8 grid gap-x-8 gap-y-3 rounded-2xl bg-cream/60 p-5 text-[0.95rem] sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">{m.done.reference}</dt>
              <dd className="font-semibold">{b.variableSymbol}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">{m.booking.room}</dt>
              <dd className="font-semibold">{m.rooms[b.roomId].name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">{m.booking.dates}</dt>
              <dd className="font-semibold">
                {formatRange(b.from, b.to, locale)} · {nightsLabel(b.price.nights, m)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">{m.booking.total}</dt>
              <dd className="font-semibold">{formatCzk(b.price.total, locale)}</dd>
            </div>
          </dl>

          {showPayment && (
            <div className="mt-8 grid items-center gap-6 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[1fr_auto] sm:p-6">
              <div>
                <h2 className="text-2xl">{m.done.payTitle}</h2>
                <dl className="mt-3 space-y-1.5 text-[0.95rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{m.done.payAmount}</dt>
                    <dd className="font-serif text-xl font-semibold text-wood">{formatCzk(due, locale)}</dd>
                  </div>
                  {acc && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">{m.done.payAccount}</dt>
                      <dd className="font-semibold">{acc}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{m.done.payIban}</dt>
                    <dd className="break-all text-right font-semibold">{normalizeIban(s.iban)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{m.done.payVs}</dt>
                    <dd className="font-semibold">{b.variableSymbol}</dd>
                  </div>
                  {b.paymentDue && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">{m.done.payDue}</dt>
                      <dd className="font-semibold">{formatDate(b.paymentDue, locale)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <figure className="mx-auto text-center">
                <Image src={`/api/qr/${b.id}?t=${t}`} alt="QR platba" width={180} height={180} unoptimized className="rounded-xl border border-line" />
                <figcaption className="mt-2 max-w-[180px] text-xs text-muted">{m.done.payQr}</figcaption>
              </figure>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${locale}`} className="btn-secondary">
              {m.done.back}
            </Link>
            {tone === "bad" && (
              <Link href={`/${locale}/rezervace?pokoj=${b.roomId}`} className="btn-primary">
                {m.done.again}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
