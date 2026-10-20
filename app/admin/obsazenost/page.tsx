import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { addDays, todayPrague } from "@/lib/dates";
import { db, getSettings } from "@/lib/db";
import { formatRange, getMessages } from "@/lib/i18n";
import { ROOM_IDS, type Night, type RoomId } from "@/lib/types";
import { addBlock, removeBlock } from "../actions";
import { Card, Flash } from "../ui";

const MONTHS = 6;

export default async function Occupancy({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; od?: string }> }) {
  await requireAdmin();
  const { msg, err, od } = await searchParams;
  const store = await db();
  const s = await getSettings();
  const cs = getMessages("cs");
  const today = todayPrague();
  const start = (od && /^\d{4}-\d{2}$/.test(od) ? od : today.slice(0, 7)) + "-01";
  const end = addMonthsStr(start, MONTHS);

  const [bookings, blocks] = await Promise.all([store.listBookings(), store.listBlocks()]);
  const byId = new Map(bookings.map((b) => [b.id, b]));
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const importName = new Map(s.icalImports.map((i) => [i.id, i.name]));
  const nights: Record<RoomId, Map<string, Night>> = { "pokoj-2": new Map(), "pokoj-5": new Map() };
  for (const r of ROOM_IDS) for (const n of await store.listNights(r, start, end)) nights[r].set(n.date, n);

  const cell = (n: Night | undefined): { cls: string; title: string; href?: string } => {
    if (!n) return { cls: "bg-white", title: "volno" };
    if (n.kind === "block") return { cls: "bg-wood/70", title: `Blokace: ${blockById.get(n.refId)?.note || "ručně"}` };
    if (n.kind === "ical") return { cls: "bg-[#7a8fb0]", title: `Import: ${importName.get(n.refId) ?? "iCal"}` };
    const b = byId.get(n.refId);
    if (!b) return { cls: "bg-sage", title: "rezervace" };
    const cls = b.status === "confirmed" ? (b.paymentStatus === "unpaid" ? "bg-sage/70" : "bg-sage-dark") : "bg-honey";
    return { cls, title: `${b.guest.name} – ${b.status}`, href: `/admin/rezervace/${b.id}` };
  };

  const months = Array.from({ length: MONTHS }, (_, i) => addMonthsStr(start, i));
  const futureBlocks = blocks.filter((b) => b.to >= today);

  return (
    <div>
      <Flash msg={msg} err={err} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Obsazenost</h1>
        <div className="flex gap-2 text-sm font-semibold">
          <Link href={`/admin/obsazenost?od=${addMonthsStr(start, -MONTHS).slice(0, 7)}`} className="btn-secondary !px-4 !py-2">
            ← Dříve
          </Link>
          <Link href={`/admin/obsazenost?od=${addMonthsStr(start, MONTHS).slice(0, 7)}`} className="btn-secondary !px-4 !py-2">
            Později →
          </Link>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <Legend cls="bg-sage-dark" label="potvrzeno a zaplaceno (i záloha)" />
        <Legend cls="bg-sage/70" label="potvrzeno, nezaplaceno" />
        <Legend cls="bg-honey" label="čeká (poptávka / platba)" />
        <Legend cls="bg-wood/70" label="ruční blokace" />
        <Legend cls="bg-[#7a8fb0]" label="Booking / Airbnb" />
      </div>

      <div className="mt-5 grid gap-5">
        {months.map((ms) => {
          const d0 = new Date(ms + "T00:00:00Z");
          const days = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 0)).getUTCDate();
          const dates = Array.from({ length: days }, (_, i) => addDays(ms, i));
          return (
            <Card key={ms} className="overflow-x-auto">
              <p className="mb-3 font-serif text-lg capitalize text-wood">{d0.toLocaleDateString("cs-CZ", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
              <table className="border-separate border-spacing-[2px] text-[10px]">
                <thead>
                  <tr>
                    <th />
                    {dates.map((d) => {
                      const wd = new Date(d + "T00:00:00Z").getUTCDay();
                      return (
                        <th key={d} className={`w-5 text-center font-semibold ${wd === 0 || wd === 6 ? "text-honey-dark" : "text-muted"} ${d === today ? "underline" : ""}`}>
                          {Number(d.slice(8))}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {ROOM_IDS.map((r) => (
                    <tr key={r}>
                      <th className="whitespace-nowrap pr-2 text-left text-xs font-semibold text-wood">{r === "pokoj-2" ? "Pro 2" : "Pro 5"}</th>
                      {dates.map((d) => {
                        const c = cell(nights[r].get(d));
                        const inner = <span className={`block h-6 w-5 rounded ${c.cls} ${d < today ? "opacity-40" : ""} border border-line`} title={`${d}: ${c.title}`} />;
                        return <td key={d}>{c.href ? <Link href={c.href}>{inner}</Link> : inner}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Zablokovat termín ručně">
          <p className="mb-4 text-sm text-muted">Např. když pokoj obsadíte sami, rekonstruujete nebo jste na dovolené. Zadejte den příjezdu a den odjezdu (poslední blokovaná noc je den před odjezdem).</p>
          <form action={addBlock} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {ROOM_IDS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="roomId" value={r} defaultChecked className="h-4 w-4 accent-honey" /> {cs.rooms[r].name}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Od (první noc)</label>
                <input type="date" name="from" required min={today} className="input" />
              </div>
              <div>
                <label className="label">Do (den odjezdu)</label>
                <input type="date" name="to" required min={today} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Poznámka</label>
              <input name="note" className="input" placeholder="např. rodina, údržba" />
            </div>
            <button className="btn-primary">Zablokovat</button>
          </form>
        </Card>

        <Card title="Ruční blokace">
          {futureBlocks.length === 0 && <p className="text-sm text-muted">Žádné aktivní blokace.</p>}
          <ul className="divide-y divide-line">
            {futureBlocks.map((bl) => (
              <li key={bl.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <b>{cs.rooms[bl.roomId].name}</b> · {formatRange(bl.from, bl.to, "cs")}
                  {bl.note && <span className="text-muted"> · {bl.note}</span>}
                </span>
                <form action={removeBlock}>
                  <input type="hidden" name="id" value={bl.id} />
                  <button className="rounded-full px-3 py-1 text-xs font-bold text-danger hover:bg-[#f7e3dc]">Odebrat</button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${cls}`} /> {label}
    </span>
  );
}

function addMonthsStr(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return d.toISOString().slice(0, 10);
}
