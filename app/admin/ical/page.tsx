import { requireAdmin } from "@/lib/auth";
import { db, getSettings } from "@/lib/db";
import { icalExportUrl } from "@/lib/ical-sync";
import { getMessages } from "@/lib/i18n";
import { ROOM_IDS, type IcalStatus } from "@/lib/types";
import { addIcalImport, regenerateIcalToken, removeIcalImportAction, syncIcalNow } from "../actions";
import { Card, Flash } from "../ui";

export default async function IcalPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireAdmin();
  const { msg, err } = await searchParams;
  const s = await getSettings();
  const cs = getMessages("cs");
  const status = await (await db()).getMeta<IcalStatus>("icalStatus");
  const resultOf = (id: string) => status?.results.find((r) => r.importId === id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Booking.com / Airbnb (iCal)</h1>
      <Flash msg={msg} err={err} />

      <Card title="1. Export – vložte do Bookingu/Airbnb">
        <p className="mb-4 text-sm text-muted">
          Tyto adresy zkopírujte do Bookingu (Kalendář → Synchronizace kalendářů → Importovat) a Airbnb (Kalendář → Dostupnost → Propojit kalendáře). Portály pak samy uvidí,
          kdy je pokoj obsazený přes váš web.
        </p>
        <div className="space-y-3">
          {ROOM_IDS.map((r) => (
            <div key={r}>
              <p className="label">{cs.rooms[r].name}</p>
              <input readOnly value={icalExportUrl(s, r)} className="input font-mono text-xs" />
            </div>
          ))}
        </div>
        <form action={regenerateIcalToken} className="mt-4">
          <button className="text-xs font-semibold text-muted underline hover:text-danger">Vygenerovat nové adresy (pokud unikly)</button>
        </form>
      </Card>

      <Card title="2. Import – kalendáře z Bookingu/Airbnb">
        <p className="mb-4 text-sm text-muted">
          V Bookingu i Airbnb najdete „Exportovat kalendář“ s adresou končící na .ics. Vložte ji sem – obsazené noci se automaticky zablokují na webu. Synchronizace probíhá
          pravidelně (viz návod) nebo tlačítkem níže.
        </p>
        <ul className="mb-6 divide-y divide-line">
          {s.icalImports.length === 0 && <li className="py-2 text-sm text-muted">Zatím žádný import.</li>}
          {s.icalImports.map((i) => {
            const r = resultOf(i.id);
            return (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {i.name} → {cs.rooms[i.roomId].name}
                  </p>
                  <p className="truncate text-xs text-muted">{i.url}</p>
                  {r && (
                    <p className={`text-xs ${r.ok ? "text-sage-dark" : "text-danger"}`}>
                      {r.ok ? `OK · ${r.nights} obsazených nocí` : `Chyba: ${r.error}`}
                      {r.conflicts.length > 0 && <span className="text-danger"> · ⚠ kolize s vlastní rezervací: {r.conflicts.slice(0, 6).join(", ")}</span>}
                    </p>
                  )}
                </div>
                <form action={removeIcalImportAction}>
                  <input type="hidden" name="id" value={i.id} />
                  <button className="rounded-full px-3 py-1 text-xs font-bold text-danger hover:bg-[#f7e3dc]">Odebrat</button>
                </form>
              </li>
            );
          })}
        </ul>
        <form action={addIcalImport} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
          <div>
            <label className="label">Název</label>
            <input name="name" placeholder="Booking" className="input" required />
          </div>
          <div>
            <label className="label">Pokoj</label>
            <select name="roomId" className="input">
              {ROOM_IDS.map((r) => (
                <option key={r} value={r}>
                  {cs.rooms[r].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Adresa kalendáře (.ics)</label>
            <input name="url" type="url" placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=…" className="input" required />
          </div>
          <button className="btn-primary">Přidat</button>
        </form>
        <form action={syncIcalNow} className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn-secondary !py-2">Synchronizovat teď</button>
          {status && <span className="text-xs text-muted">Naposledy: {new Date(status.at).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })}</span>}
        </form>
      </Card>
    </div>
  );
}
