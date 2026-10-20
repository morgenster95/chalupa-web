import Link from "next/link";
import { db } from "@/lib/db";
import { formatRange, getMessages } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import { verify } from "@/lib/tokens";
import { decideFromEmail } from "../../actions";
import { Flash, StatusBadge } from "../../ui";

// Stránka z odkazu v e-mailu majiteli. Potvrzení vyžaduje kliknutí na tlačítko
// (samotné otevření odkazu nic nemění – kvůli antivirovým skenerům e-mailů).
export default async function Decide({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ a?: string; t?: string; msg?: string; err?: string; done?: string }> }) {
  const { id } = await params;
  const { a = "confirm", t = "", msg, err, done } = await searchParams;
  if (!verify("decide", id, t)) return <p className="mx-auto mt-20 max-w-md text-center text-danger">Neplatný nebo poškozený odkaz.</p>;
  const b = await (await db()).getBooking(id);
  if (!b) return <p className="mx-auto mt-20 max-w-md text-center">Rezervace neexistuje.</p>;
  const cs = getMessages("cs");
  const confirm = a === "confirm";
  return (
    <div className="mx-auto mt-10 max-w-lg">
      <Flash msg={msg} err={err} />
      <div className="card bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl">{confirm ? "Potvrdit poptávku?" : "Odmítnout poptávku?"}</h1>
          <StatusBadge status={b.status} />
        </div>
        <dl className="mt-5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Host</dt>
            <dd className="font-semibold">{b.guest.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Pokoj</dt>
            <dd className="font-semibold">{cs.rooms[b.roomId].name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Termín</dt>
            <dd className="font-semibold">{formatRange(b.from, b.to, "cs")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Celkem</dt>
            <dd className="font-semibold">{formatCzk(b.price.total)}</dd>
          </div>
        </dl>
        {!done && (b.status === "pending" || b.status === "expired") && (
          <form action={decideFromEmail} className="mt-6">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="t" value={t} />
            <input type="hidden" name="a" value={a} />
            <button className={confirm ? "btn-sage w-full" : "btn w-full bg-danger text-white"}>{confirm ? "✓ Ano, potvrdit a poslat QR platbu" : "✕ Ano, odmítnout"}</button>
          </form>
        )}
        <Link href={`/admin/rezervace/${id}`} className="mt-4 block text-center text-sm font-semibold text-honey-dark hover:underline">
          Otevřít v administraci
        </Link>
      </div>
    </div>
  );
}
