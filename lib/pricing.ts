import { diffDays, inMonthDayRange, isIsoDate, nightsBetween, weekday } from "./dates.ts";
import type { PriceBreakdown, RoomId, Settings } from "./types.ts";

export interface StayInput {
  roomId: RoomId;
  from: string;
  to: string;
  adults: number;
  children: number;
  extraBed: boolean;
}

export type StayError =
  | "invalid_dates"
  | "min_nights"
  | "max_nights"
  | "room_inactive"
  | "too_many_guests"
  | "no_adult"
  | "extra_bed_unavailable";

export const MAX_NIGHTS = 60;

/** Kapacita pokoje včetně přistýlky. */
export function capacity(settings: Settings, roomId: RoomId, extraBed: boolean): number {
  const r = settings.rooms[roomId];
  return r.maxGuests + (extraBed && r.extraBedAvailable ? 1 : 0);
}

export function validateStay(settings: Settings, s: StayInput): StayError | null {
  const room = settings.rooms[s.roomId];
  if (!room) return "room_inactive";
  if (!isIsoDate(s.from) || !isIsoDate(s.to) || s.to <= s.from) return "invalid_dates";
  const n = diffDays(s.from, s.to);
  if (n < Math.max(1, settings.minNights)) return "min_nights";
  if (n > MAX_NIGHTS) return "max_nights";
  if (!room.active) return "room_inactive";
  if (!Number.isInteger(s.adults) || !Number.isInteger(s.children) || s.adults < 1) return "no_adult";
  if (s.children < 0) return "too_many_guests";
  if (s.extraBed && !room.extraBedAvailable) return "extra_bed_unavailable";
  if (s.adults + s.children > capacity(settings, s.roomId, s.extraBed)) return "too_many_guests";
  return null;
}

/** Přirážka v % pro danou noc (nejvyšší platná sezóna + víkend). */
export function surchargeFor(settings: Settings, date: string): number {
  let season = 0;
  let found = false;
  for (const s of settings.seasons) {
    if (inMonthDayRange(date, s.from, s.to)) {
      season = found ? Math.max(season, s.surchargePercent) : s.surchargePercent;
      found = true;
    }
  }
  const wd = weekday(date); // noc z pátku (5) a ze soboty (6)
  const weekend = wd === 5 || wd === 6 ? settings.weekendSurchargePercent : 0;
  return season + weekend;
}

/** Výpočet ceny. Předpokládá validní vstup (viz validateStay). */
export function calculatePrice(settings: Settings, s: StayInput): PriceBreakdown {
  const room = settings.rooms[s.roomId];
  const dates = nightsBetween(s.from, s.to);
  const nights = dates.length;
  const guests = s.adults + s.children;
  // Osoba na přistýlce se nepočítá jako „další osoba“ – platí se přistýlka.
  const onBeds = Math.min(guests, room.maxGuests);
  const extraPersonsCount = Math.max(0, onBeds - room.includedGuests);

  const nightly = dates.map((date) => ({
    date,
    price: Math.round(room.basePrice * (1 + surchargeFor(settings, date) / 100)),
  }));
  const accommodation = nightly.reduce((a, n) => a + n.price, 0);
  const extraPersons = extraPersonsCount * room.extraPersonPrice * nights;
  const extraBed = s.extraBed && room.extraBedAvailable ? room.extraBedPrice * nights : 0;
  const cleaning = settings.cleaningFee;
  const taxedPersons = settings.cityTaxChildrenExempt ? s.adults : guests;
  const cityTax = settings.cityTax * taxedPersons * nights;
  const total = accommodation + extraPersons + extraBed + cleaning + cityTax;
  const pct = Math.min(100, Math.max(0, settings.depositPercent));
  const deposit = pct > 0 && pct < 100 ? Math.round((total * pct) / 100) : total;

  return { nights, nightly, accommodation, extraPersons, extraBed, cleaning, cityTax, total, deposit };
}

export function formatCzk(n: number, locale = "cs"): string {
  return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(n);
}
