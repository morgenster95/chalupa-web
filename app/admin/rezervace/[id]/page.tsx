import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { publicBookingUrl } from "@/lib/booking";
import { db } from "@/lib/db";
import { formatDate, formatRange, getMessages } from "@/lib/i18n";
import { amountDue } from "@/lib/payments";
import { formatCzk } from "@/lib/pricing";
import { bookingAction } from "../../actions";
import { Card, Flash, PAYMENT_LABEL, PaymentBadge, StatusBadge } from "../../ui";

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { msg, err } = await searchParams;
  const b = await (await db()).getBooking(id);
  if (!b) notFound();
  const cs = getMessages("cs");
  const p = b.price;
  const active = ["pending", "awaiting_payment", "confirmed", "conflict"].includes(b.status);

  const rows: [string, React.ReactNode][] = [
    ["Pokoj", cs.rooms[b.roomId].name],
    ["Termín", `${formatRange(b.from, b.to, "cs")} (${p.nights} nocí)`],
    ["Hosté", `${b.adults} dospělí, ${b.children} děti${b.extraBed ? ", přistýlka" : ""}`],
    ["Způsob", b.mode === "instant" ? "Okamžitá rezervace – karta (Stripe)" : "Nezávazná poptávka – převod (QR)"],
    ["Variabilní symbol", b.variableSymbol],
    ["Jazyk hosta", b.locale.toUpperCase()],
    ["Vytvořeno", new Date(b.createdAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })],
  ];
  if (b.holdUntil) rows.push(["Blokováno do", new Date(b.holdUntil).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })]);
  if (b.paymentDue) rows.push(["Splatnost", formatDate(b.paymentDue, "cs")]);

  return (
    <div>
      <Link href="/admin" className="text-sm font-semibold text-muted hover:text-wood">
        ← Zpět na přehled
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{b.guest.name}</h1>
        <StatusBadge status={b.status} />
        <PaymentBadge status={b.paymentStatus} />
      </div>
      <div className="mt-6">
        <Flash msg={msg} err={err} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Pobyt">
            <dl className="divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Host">
            <p>
              <a href={`mailto:${b.guest.email}`} className="font-semibold text-honey-dark hover:underline">
                {b.guest.email}
              </a>
              <br />
              <a href={`tel:${b.guest.phone}`} className="font-semibold text-honey-dark hover:underline">
                {b.guest.phone}
              </a>
            </p>
            {b.guest.note && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cream/70 p-3 text-sm">{b.guest.note}</p>}
          </Card>
          <Card title="Cena">
            <dl className="space-y-1.5 text-sm">
              {(
                [
                  ["Ubytování", p.accommodation],
                  ["Další osoby", p.extraPersons],
                  ["Přistýlka", p.extraBed],
                  ["Úklid", p.cleaning],
                  ["Poplatek z pobytu", p.cityTax],
                ] as [string, number][]
              )
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-muted">{k}</dt>
                    <dd className="tabular-nums">{formatCzk(v)}</dd>
                  </div>
                ))}
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                <dt>Celkem</dt>
                <dd className="tabular-nums">{formatCzk(p.total)}</dd>
              </div>
              {p.deposit < p.total && (
                <div className="flex justify-between text-sage-dark">
                  <dt>Záloha</dt>
                  <dd className="tabular-nums">{formatCzk(p.deposit)}</dd>
                </div>
              )}
              {b.status === "confirmed" && amountDue(b) > 0 && (
                <div className="flex justify-between text-honey-dark">
                  <dt>Aktuálně k úhradě</dt>
                  <dd className="font-bold tabular-nums">{formatCzk(amountDue(b))}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          {(b.status === "pending" || b.status === "expired") && b.mode === "inquiry" && (
            <Card title="Poptávka" className="border-honey">
              <p className="mb-4 text-sm text-muted">Po potvrzení dostane host e-mail s QR platbou {p.deposit < p.total ? "na zálohu" : "na celou částku"}.</p>
              <div className="flex flex-wrap gap-2">
                <form action={bookingAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="action" value="confirm" />
                  <button className="btn-sage">
                    ✓ Potvrdit
                  </button>
                </form>
                <form action={bookingAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="action" value="decline" />
                  <button className="btn border border-danger/40 text-danger hover:bg-[#f7e3dc]">
                    ✕ Odmítnout
                  </button>
                </form>
              </div>
            </Card>
          )}

          <Card title="Platba">
            <form action={bookingAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="action" value="payment" />
              <select name="paymentStatus" defaultValue={b.paymentStatus} className="input !w-auto !py-2">
                {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button className="btn-secondary !py-2">Uložit</button>
            </form>
            <p className="mt-3 text-xs text-muted">Platby převodem kontrolujte podle variabilního symbolu {b.variableSymbol}.</p>
            {b.stripeSessionId && <p className="mt-2 break-all text-xs text-muted">Stripe: {b.stripeSessionId}</p>}
          </Card>

          {active && (
            <Card title="Zrušit rezervaci">
              <form action={bookingAction} className="space-y-3">
                <input type="hidden" name="id" value={b.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-honey" /> Poslat hostovi e-mail o zrušení
                </label>
                <input type="hidden" name="action" value="cancel" />
                  <button className="btn border border-danger/40 !py-2 text-danger hover:bg-[#f7e3dc]">
                  Zrušit a uvolnit termín
                </button>
              </form>
            </Card>
          )}

          <Card title="Historie">
            <ol className="space-y-2 text-sm">
              {[...b.history].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {h.action} <span className="text-muted">· {h.by}</span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted">{new Date(h.at).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })}</span>
                </li>
              ))}
            </ol>
            <a href={publicBookingUrl(b)} target="_blank" className="mt-4 inline-block text-sm font-semibold text-honey-dark hover:underline">
              Stránka rezervace pro hosta ↗
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
