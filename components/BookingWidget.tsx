"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { capacity, calculatePrice, formatCzk, validateStay } from "@/lib/pricing";
import { diffDays } from "@/lib/dates";
import type { Messages } from "@/lib/i18n";
import type { RoomId, Settings } from "@/lib/types";
import Icon from "./Icon";
import RangeCalendar from "./RangeCalendar";

export type PublicSettings = Omit<Settings, "icalToken" | "icalImports">;

interface Props {
  locale: string;
  m: Messages;
  s: PublicSettings;
  today: string;
  initialRoom: RoomId;
  lockRoom?: boolean;
  stripeReady: boolean;
}

function fill(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function nightsWord(n: number, m: Messages) {
  if (n === 1) return m.booking.nightsOne;
  if (n >= 2 && n <= 4) return m.booking.nightsFew;
  return m.booking.nightsMany;
}

const INTL: Record<string, string> = { cs: "cs-CZ", en: "en-GB", de: "de-DE" };

export default function BookingWidget({ locale, m, s, today, initialRoom, lockRoom, stripeReady }: Props) {
  const rooms = (Object.keys(s.rooms) as RoomId[]).filter((r) => s.rooms[r].active);
  const [roomId, setRoomId] = useState<RoomId>(rooms.includes(initialRoom) ? initialRoom : rooms[0]);
  const [busy, setBusy] = useState<Set<string> | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraBed, setExtraBed] = useState(false);
  const instantAvailable = s.modes.instant && stripeReady;
  const [mode, setMode] = useState<"inquiry" | "instant">(s.modes.inquiry ? "inquiry" : "instant");
  const [guest, setGuest] = useState({ name: "", email: "", phone: "", note: "" });
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setBusy(null);
    fetch(`/api/availability?room=${roomId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { busy: string[] }) => alive && setBusy(new Set(j.busy)))
      .catch(() => alive && setBusy(new Set()));
    return () => {
      alive = false;
    };
  }, [roomId]);

  const room = s.rooms[roomId];
  const maxGuests = capacity(s as Settings, roomId, extraBed);
  useEffect(() => {
    if (!room.extraBedAvailable) setExtraBed(false);
  }, [room.extraBedAvailable]);
  useEffect(() => {
    if (adults + children > maxGuests) setChildren(Math.max(0, maxGuests - adults));
    if (adults > maxGuests) setAdults(maxGuests);
  }, [maxGuests, adults, children]);

  const stay = from && to ? { roomId, from, to, adults, children, extraBed } : null;
  const stayError = stay ? validateStay(s as Settings, stay) : null;
  const price = useMemo(() => (stay && !stayError ? calculatePrice(s as Settings, stay) : null), [stay, stayError, s]);
  const deposit = price && mode === "inquiry" && price.deposit < price.total ? price.deposit : null;

  const fmtDate = (d: string) => new Intl.DateTimeFormat(INTL[locale], { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));

  const errText = (code: string) => {
    const e = m.errors as Record<string, string>;
    return fill(e[code] ?? e.server, { n: s.minNights });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stay || stayError) return setError(m.booking.selectDatesFirst);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...stay, mode, locale, guest, website: honeypot.current?.value ?? "", startedAt: startedAt.current }),
      });
      const j = await res.json();
      if (j.ok) {
        window.location.href = j.redirect;
        return;
      }
      setError(errText(j.error));
      if (j.error === "conflict") {
        setFrom(null);
        setTo(null);
        const r = await fetch(`/api/availability?room=${roomId}`, { cache: "no-store" }).then((r) => r.json());
        setBusy(new Set(r.busy));
      }
    } catch {
      setError(m.errors.server);
    }
    setSending(false);
  }

  if (!s.modes.inquiry && !instantAvailable) {
    return <p className="card p-6 text-muted">{m.booking.unavailable}</p>;
  }

  const Stepper = ({ label, value, set, min, max }: { label: string; value: number; set: (n: number) => void; min: number; max: number }) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-[0.95rem] font-semibold text-wood">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-lg text-wood disabled:opacity-30" aria-label="−">
          −
        </button>
        <span className="w-5 text-center font-bold tabular-nums">{value}</span>
        <button type="button" onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-lg text-wood disabled:opacity-30" aria-label="+">
          +
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="space-y-6">
        {!lockRoom && rooms.length > 1 && (
          <div className="card p-2">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={m.booking.room}>
              {rooms.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={r === roomId}
                  onClick={() => {
                    setRoomId(r);
                    setFrom(null);
                    setTo(null);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left transition ${r === roomId ? "bg-sage-dark text-white shadow-soft" : "hover:bg-cream"}`}
                >
                  <span className="block font-serif text-lg leading-tight">{m.rooms[r].name}</span>
                  <span className={`text-sm ${r === roomId ? "text-white/80" : "text-muted"}`}>
                    {m.rooms.from} {formatCzk(s.rooms[r].basePrice, locale)} {m.rooms.perNight}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">{m.booking.dates}</h2>
            <p className="text-sm text-muted">{!from ? m.booking.pickArrival : !to ? m.booking.pickDeparture : `${fmtDate(from)} → ${fmtDate(to)}`}</p>
          </div>
          {busy ? (
            <RangeCalendar
              locale={locale}
              today={today}
              busy={busy}
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
                setError(null);
                if (f && t) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
              }}
              labels={m.booking}
            />
          ) : (
            <div className="grid h-72 place-items-center text-muted">{m.booking.loading}</div>
          )}
          {from && (
            <button type="button" onClick={() => (setFrom(null), setTo(null))} className="mt-4 text-sm font-semibold text-honey-dark hover:underline">
              {m.booking.clear}
            </button>
          )}
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Icon name="clock" className="h-4 w-4 text-sage-dark" />
            {fill(m.booking.checkInOut, { in: s.checkIn, out: s.checkOut })} · {m.rooms.priceMinNights}: {s.minNights} {nightsWord(s.minNights, m)}
          </p>
        </div>

        <div className="card p-5 sm:p-7">
          <h2 className="mb-2 text-2xl">{m.booking.guests}</h2>
          <div className="divide-y divide-line">
            <Stepper label={m.booking.adults} value={adults} set={setAdults} min={1} max={maxGuests - children} />
            <Stepper label={m.booking.children} value={children} set={setChildren} min={0} max={maxGuests - adults} />
            {room.extraBedAvailable && (
              <label className="flex cursor-pointer items-center justify-between gap-3 py-3">
                <span className="text-[0.95rem] font-semibold text-wood">
                  {m.booking.extraBed} <span className="font-normal text-muted">(+{formatCzk(room.extraBedPrice, locale)} {m.rooms.perNight})</span>
                </span>
                <input type="checkbox" checked={extraBed} onChange={(e) => setExtraBed(e.target.checked)} className="h-5 w-5 accent-honey" />
              </label>
            )}
          </div>
        </div>
      </div>

      <div ref={formRef} className="space-y-6 lg:sticky lg:top-24">
        <div className="card p-5 sm:p-7">
          <h2 className="text-2xl">{m.booking.summary}</h2>
          <p className="mt-1 text-sm text-muted">{m.rooms[roomId].name}</p>
          {!stay && <p className="mt-4 rounded-xl bg-cream/70 p-4 text-sm text-muted">{m.booking.selectDatesFirst}</p>}
          {stay && stayError && <p className="mt-4 rounded-xl bg-[#f7e3dc] p-4 text-sm text-danger">{errText(stayError)}</p>}
          {price && (
            <dl className="mt-4 space-y-2 text-[0.95rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">
                  {m.booking.accommodation} · {price.nights} {nightsWord(price.nights, m)}
                </dt>
                <dd className="tabular-nums">{formatCzk(price.accommodation, locale)}</dd>
              </div>
              {price.extraPersons > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{m.booking.extraPersons}</dt>
                  <dd className="tabular-nums">{formatCzk(price.extraPersons, locale)}</dd>
                </div>
              )}
              {price.extraBed > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{m.booking.extraBedLine}</dt>
                  <dd className="tabular-nums">{formatCzk(price.extraBed, locale)}</dd>
                </div>
              )}
              {price.cleaning > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{m.booking.cleaning}</dt>
                  <dd className="tabular-nums">{formatCzk(price.cleaning, locale)}</dd>
                </div>
              )}
              {price.cityTax > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{m.booking.cityTax}</dt>
                  <dd className="tabular-nums">{formatCzk(price.cityTax, locale)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <dt className="font-serif text-xl text-wood">{m.booking.total}</dt>
                <dd className="font-serif text-2xl font-semibold tabular-nums text-wood">{formatCzk(price.total, locale)}</dd>
              </div>
              {deposit !== null && (
                <div className="flex justify-between gap-4 text-sm text-sage-dark">
                  <dt>
                    {m.booking.deposit} ({s.depositPercent} %)
                  </dt>
                  <dd className="font-bold tabular-nums">{formatCzk(deposit, locale)}</dd>
                </div>
              )}
            </dl>
          )}
          {price && diffDays(from!, to!) > 0 && (
            <p className="mt-3 text-xs text-muted">
              {new Intl.NumberFormat(INTL[locale]).format(Math.round(price.total / price.nights))} Kč / {m.booking.nightsOne} ⌀
            </p>
          )}
        </div>

        <div className="card p-5 sm:p-7">
          <h2 className="text-2xl">{m.booking.contact}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="bk-name">{m.booking.name}</label>
              <input id="bk-name" className="input" required autoComplete="name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <label className="label" htmlFor="bk-email">{m.booking.email}</label>
                <input id="bk-email" type="email" className="input" required autoComplete="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="bk-phone">{m.booking.phone}</label>
                <input id="bk-phone" type="tel" className="input" required minLength={6} autoComplete="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="bk-note">{m.booking.note}</label>
              <textarea id="bk-note" rows={3} className="input resize-y" value={guest.note} onChange={(e) => setGuest({ ...guest, note: e.target.value })} />
            </div>
            {/* honeypot – pro roboty */}
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
          </div>

          <fieldset className="mt-6">
            <legend className="label">{m.booking.howToPay}</legend>
            <div className="mt-1 space-y-3">
              {s.modes.inquiry && (
                <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${mode === "inquiry" ? "border-honey bg-honey-light/30" : "border-line bg-white hover:border-honey/50"}`}>
                  <input type="radio" name="mode" className="mt-1 h-4 w-4 accent-honey" checked={mode === "inquiry"} onChange={() => setMode("inquiry")} />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-wood">
                      <Icon name="qr" className="h-4 w-4" /> {m.booking.modeInquiry}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      {fill(s.depositPercent > 0 && s.depositPercent < 100 ? m.booking.modeInquiryText : m.booking.modeInquiryTextFull, { h: s.holdHours, pct: s.depositPercent })}
                    </span>
                  </span>
                </label>
              )}
              {instantAvailable && (
                <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${mode === "instant" ? "border-honey bg-honey-light/30" : "border-line bg-white hover:border-honey/50"}`}>
                  <input type="radio" name="mode" className="mt-1 h-4 w-4 accent-honey" checked={mode === "instant"} onChange={() => setMode("instant")} />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-wood">
                      <Icon name="card" className="h-4 w-4" /> {m.booking.modeInstant}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{m.booking.modeInstantText}</span>
                  </span>
                </label>
              )}
            </div>
          </fieldset>

          <label className="mt-5 flex cursor-pointer gap-3 text-sm text-muted">
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-honey" />
            <span>
              {m.booking.terms}{" "}
              <Link href={`/${locale}/podminky`} target="_blank" className="font-semibold text-honey-dark underline">
                {m.booking.termsLink}
              </Link>
            </span>
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-[#f7e3dc] p-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={sending || !price} className="btn-primary mt-5 w-full !py-3.5 text-base">
            {sending ? m.booking.sending : mode === "instant" ? m.booking.submitInstant : m.booking.submitInquiry}
            {!sending && <Icon name="arrow" className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </form>
  );
}
