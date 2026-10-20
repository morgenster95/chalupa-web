import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { expireStaleHolds } from "@/lib/booking";
import { todayPrague } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatRange, getMessages } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import type { Booking } from "@/lib/types";
import { Flash, PaymentBadge, StatusBadge } from "./ui";

const FILTERS = [
  { key: "aktivni", label: "Aktivní a nadcházející" },
  { key: "cekajici", label: "Čekající" },
  { key: "vse", label: "Vše" },
];

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ f?: string; msg?: string; err?: string }> }) {
  await requireAdmin();
  const { f = "aktivni", msg, err } = await searchParams;
  await expireStaleHolds();
  const all = await (await db()).listBookings();
  const today = todayPrague();
  const cs = getMessages("cs");

  const pending = all.filter((b) => b.status === "pending");
  const unpaid = all.filter((b) => b.status === "confirmed" && b.paymentStatus === "unpaid" && b.mode === "inquiry");
  const upcoming = all.filter((b) => b.status === "confirmed" && b.to >= today);

  let list: Booking[];
  if (f === "cekajici") list = all.filter((b) => b.status === "pending" || b.status === "awaiting_payment" || b.status === "conflict");
  else if (f === "vse") list = all;
  else list = all.filter((b) => ["pending", "awaiting_payment", "confirmed", "conflict"].includes(b.status) && b.to >= today).sort((a, b) => a.from.localeCompare(b.from));

  return (
    <div>
      <Flash msg={msg} err={err} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Čeká na vaše potvrzení" value={pending.length} highlight={pending.length > 0} />
        <Stat label="Potvrzeno, čeká na platbu převodem" value={unpaid.length} />
        <Stat label="Nadcházející potvrzené pobyty" value={upcoming.length} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Rezervace</h1>
        <div className="flex gap-1 rounded-full bg-white p-1 text-sm font-semibold shadow-soft">
          {FILTERS.map((x) => (
            <Link key={x.key} href={`/admin?f=${x.key}`} className={`rounded-full px-3 py-1.5 ${f === x.key ? "bg-sage-dark text-white" : "text-wood hover:bg-cream"}`}>
              {x.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Termín</th>
              <th className="px-4 py-3">Pokoj</th>
              <th className="px-4 py-3">Host</th>
              <th className="px-4 py-3">Osoby</th>
              <th className="px-4 py-3 text-right">Celkem</th>
              <th className="px-4 py-3">Stav</th>
              <th className="px-4 py-3">Platba</th>
              <th className="px-4 py-3">VS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  Zatím tu nic není.
                </td>
              </tr>
            )}
            {list.map((b) => (
              <tr key={b.id} className="hover:bg-cream/40">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/rezervace/${b.id}`} className="text-wood hover:text-honey-dark hover:underline">
                    {formatRange(b.from, b.to, "cs")}
                  </Link>
                  <span className="block text-xs font-normal text-muted">{b.price.nights} n. · {b.mode === "instant" ? "karta" : "poptávka"}</span>
                </td>
                <td className="px-4 py-3">{cs.rooms[b.roomId].name}</td>
                <td className="px-4 py-3">
                  {b.guest.name}
                  <span className="block text-xs text-muted">{b.guest.email}</span>
                </td>
                <td className="px-4 py-3">
                  {b.adults + b.children}
                  {b.extraBed ? " + př." : ""}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCzk(b.price.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge status={b.paymentStatus} />
                </td>
                <td className="px-4 py-3 text-muted tabular-nums">{b.variableSymbol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "border-honey bg-honey-light/40" : "bg-white"}`}>
      <p className="font-serif text-4xl text-wood">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
