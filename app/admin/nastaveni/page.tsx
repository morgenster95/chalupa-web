import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { getMessages } from "@/lib/i18n";
import { ROOM_IDS } from "@/lib/types";
import { saveSettings } from "../actions";
import { Card, Flash } from "../ui";

function Field({ label, name, defaultValue, type = "text", hint, suffix, ...rest }: { label: string; name: string; defaultValue?: string | number; type?: string; hint?: string; suffix?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <input id={name} name={name} type={type} defaultValue={defaultValue} className={`input ${suffix ? "pr-16" : ""}`} {...rest} />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-semibold text-wood">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-honey" /> {label}
    </label>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireAdmin();
  const { msg, err } = await searchParams;
  const s = await getSettings();
  const cs = getMessages("cs");
  const seasonRows = [...s.seasons, { id: "new1", name: "", from: "", to: "", surchargePercent: 0 }, { id: "new2", name: "", from: "", to: "", surchargePercent: 0 }];

  return (
    <form action={saveSettings} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Ceník a nastavení</h1>
        <button className="btn-primary">Uložit vše</button>
      </div>
      <Flash msg={msg} err={err} />

      <div className="grid gap-6 lg:grid-cols-2">
        {ROOM_IDS.map((id) => {
          const r = s.rooms[id];
          return (
            <Card key={id} title={cs.rooms[id].name}>
              <div className="space-y-4">
                <Check label="Pokoj je k pronájmu (zobrazit na webu)" name={`${id}_active`} defaultChecked={r.active} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cena za noc" name={`${id}_basePrice`} type="number" min={0} defaultValue={r.basePrice} suffix="Kč" />
                  <Field label="Osob v základní ceně" name={`${id}_includedGuests`} type="number" min={1} max={10} defaultValue={r.includedGuests} />
                  <Field label="Max. osob (bez přistýlky)" name={`${id}_maxGuests`} type="number" min={1} max={10} defaultValue={r.maxGuests} />
                  <Field label="Příplatek za další osobu" name={`${id}_extraPersonPrice`} type="number" min={0} defaultValue={r.extraPersonPrice} suffix="Kč/noc" />
                </div>
                <div className="grid grid-cols-2 items-end gap-4">
                  <Check label="Přistýlka k dispozici" name={`${id}_extraBedAvailable`} defaultChecked={r.extraBedAvailable} />
                  <Field label="Cena přistýlky" name={`${id}_extraBedPrice`} type="number" min={0} defaultValue={r.extraBedPrice} suffix="Kč/noc" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Poplatky a pravidla">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimální počet nocí" name="minNights" type="number" min={1} max={30} defaultValue={s.minNights} />
            <Field label="Úklid (jednorázově)" name="cleaningFee" type="number" min={0} defaultValue={s.cleaningFee} suffix="Kč" />
            <Field label="Poplatek z pobytu" name="cityTax" type="number" min={0} defaultValue={s.cityTax} suffix="Kč/os/noc" />
            <div className="flex items-end pb-3">
              <Check label="Děti do 18 let osvobozeny" name="cityTaxChildrenExempt" defaultChecked={s.cityTaxChildrenExempt} />
            </div>
            <Field label="Check-in od" name="checkIn" type="time" defaultValue={s.checkIn} />
            <Field label="Check-out do" name="checkOut" type="time" defaultValue={s.checkOut} />
          </div>
        </Card>

        <Card title="Platby a rezervace">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <Check label="Nezávazná poptávka (QR převod)" name="mode_inquiry" defaultChecked={s.modes.inquiry} />
              <Check label="Okamžitá platba kartou (Stripe)" name="mode_instant" defaultChecked={s.modes.instant} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Záloha při převodu" name="depositPercent" type="number" min={0} max={100} defaultValue={s.depositPercent} suffix="%" hint="0 nebo 100 = platí se celá částka" />
              <Field label="Splatnost po potvrzení" name="paymentDueDays" type="number" min={0} max={60} defaultValue={s.paymentDueDays} suffix="dní" />
              <Field label="Blokace poptávky" name="holdHours" type="number" min={1} max={168} defaultValue={s.holdHours} suffix="hodin" />
            </div>
            <Field label="IBAN pro QR platby" name="iban" defaultValue={s.iban} placeholder="CZ00 0000 0000 0000 0000 0000" hint="Najdete v internetovém bankovnictví. Kontrolujeme platnost." />
            <Field label="Jméno příjemce (v QR platbě)" name="accountName" defaultValue={s.accountName} maxLength={35} />
          </div>
        </Card>
      </div>

      <Card title="Sezónní a víkendové ceny">
        <div className="max-w-xs">
          <Field label="Víkendová přirážka (noci pá→so, so→ne)" name="weekendSurchargePercent" type="number" min={-50} max={200} defaultValue={s.weekendSurchargePercent} suffix="%" />
        </div>
        <p className="mb-3 mt-6 text-sm text-muted">
          Sezóny: datum ve formátu <b>MM-DD</b> (např. 07-01 až 08-31). Může jít i přes Nový rok (12-23 až 01-01). Záporné procento = sleva. Prázdný řádek se ignoruje.
        </p>
        <div className="space-y-2">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-3 text-xs font-bold uppercase tracking-wider text-muted sm:grid">
            <span>Název</span>
            <span>Od (MM-DD)</span>
            <span>Do (MM-DD)</span>
            <span>Přirážka %</span>
          </div>
          {seasonRows.map((se) => (
            <div key={se.id} className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
              <input name="season_name" defaultValue={se.name} placeholder="např. Léto" className="input col-span-2 sm:col-span-1" />
              <input name="season_from" defaultValue={se.from} placeholder="07-01" pattern="\d{2}-\d{2}" className="input" />
              <input name="season_to" defaultValue={se.to} placeholder="08-31" pattern="\d{2}-\d{2}" className="input" />
              <input name="season_pct" type="number" defaultValue={se.surchargePercent} className="input" />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Kontaktní údaje">
          <div className="space-y-4">
            <Field label="Název chalupy" name="name" defaultValue={s.name} required />
            <Field label="Ulice a číslo" name="address" defaultValue={s.address} />
            <Field label="Obec" name="municipality" defaultValue={s.municipality} />
            <Field
              label="Poloha na mapě (GPS)"
              name="gps"
              defaultValue={`${s.lat}, ${s.lng}`}
              placeholder="49.6899, 14.0104"
              hint="Na Mapy.cz klikněte pravým tlačítkem na chalupu, zkopírujte souřadnice a vložte je sem."
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail (sem chodí poptávky)" name="email" type="email" defaultValue={s.email} />
              <Field label="Telefon" name="phone" defaultValue={s.phone} />
            </div>
            <Field label="Podtitulek – česky" name="tagline_cs" defaultValue={s.tagline.cs} />
            <Field label="Podtitulek – anglicky" name="tagline_en" defaultValue={s.tagline.en} />
            <Field label="Podtitulek – německy" name="tagline_de" defaultValue={s.tagline.de} />
          </div>
        </Card>

        <Card title="Zvířata">
          <div className="space-y-4">
            <Check label="Zvířata povolena" name="petsAllowed" defaultChecked={s.petsAllowed} />
            <Field label="Text – česky" name="petsNote_cs" defaultValue={s.petsNote.cs} />
            <Field label="Text – anglicky" name="petsNote_en" defaultValue={s.petsNote.en} />
            <Field label="Text – německy" name="petsNote_de" defaultValue={s.petsNote.de} />
          </div>
        </Card>
      </div>

      <Card title="Storno podmínky">
        <div className="grid gap-4 lg:grid-cols-3">
          {(["cs", "en", "de"] as const).map((l) => (
            <div key={l}>
              <label className="label">{l === "cs" ? "Česky" : l === "en" ? "Anglicky" : "Německy"}</label>
              <textarea name={`cancel_${l}`} rows={7} defaultValue={s.cancellationPolicy[l]} className="input text-sm" />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button className="btn-primary">Uložit vše</button>
      </div>
    </form>
  );
}
