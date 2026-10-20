import type { Settings } from "./types.ts";

/**
 * Výchozí nastavení – ZÁSTUPNÉ HODNOTY.
 * Skutečné údaje se vyplní v administraci (/admin/nastaveni) a uloží do databáze.
 */
export const DEFAULT_SETTINGS: Settings = {
  name: "Chalupa pod Oborou",
  tagline: {
    cs: "Útulné pokoje na kraji lesa, pět minut od Příbrami",
    en: "Cosy rooms at the edge of the forest, five minutes from Příbram",
    de: "Gemütliche Zimmer am Waldrand, fünf Minuten von Příbram",
  },
  address: "[Ulice a číslo]",
  municipality: "[Obec], okres Příbram",
  // zástupná poloha (Příbram) – přesné souřadnice chalupy se vyplní v administraci
  lat: 49.6899,
  lng: 14.0104,
  email: "info@example.cz",
  phone: "+420 000 000 000",
  iban: "CZ6508000000192000145399",
  accountName: "Chalupa pod Oborou",
  checkIn: "15:00",
  checkOut: "10:00",
  petsAllowed: false,
  petsNote: {
    cs: "Domácí mazlíčky bohužel nepřijímáme.",
    en: "Unfortunately, pets are not allowed.",
    de: "Haustiere sind leider nicht erlaubt.",
  },
  minNights: 2,
  cleaningFee: 500,
  cityTax: 30,
  cityTaxChildrenExempt: true,
  weekendSurchargePercent: 10,
  seasons: [
    { id: "leto", name: "Hlavní sezóna (léto)", from: "07-01", to: "08-31", surchargePercent: 15 },
    { id: "vanoce", name: "Vánoce a Silvestr", from: "12-23", to: "01-01", surchargePercent: 25 },
  ],
  rooms: {
    "pokoj-2": {
      active: true,
      basePrice: 1400,
      includedGuests: 2,
      maxGuests: 2,
      extraPersonPrice: 0,
      extraBedAvailable: true,
      extraBedPrice: 350,
    },
    "pokoj-5": {
      active: true,
      basePrice: 2400,
      includedGuests: 4,
      maxGuests: 5,
      extraPersonPrice: 400,
      extraBedAvailable: false,
      extraBedPrice: 0,
    },
  },
  depositPercent: 30,
  paymentDueDays: 5,
  holdHours: 48,
  cancellationPolicy: {
    cs: "Zrušení více než 30 dní před příjezdem: záloha se vrací v plné výši.\nZrušení 30–14 dní před příjezdem: vracíme 50 % zálohy.\nZrušení méně než 14 dní před příjezdem: záloha propadá.\nPokud termín obsadíme jinými hosty, zálohu vrátíme.",
    en: "Cancellation more than 30 days before arrival: full refund of the deposit.\nCancellation 30–14 days before arrival: 50% of the deposit refunded.\nCancellation less than 14 days before arrival: the deposit is non-refundable.\nIf we re-let the dates, we will refund the deposit.",
    de: "Stornierung mehr als 30 Tage vor Anreise: volle Rückerstattung der Anzahlung.\nStornierung 30–14 Tage vor Anreise: 50 % der Anzahlung werden erstattet.\nStornierung weniger als 14 Tage vor Anreise: die Anzahlung verfällt.\nWenn wir den Termin anderweitig vermieten, erstatten wir die Anzahlung.",
  },
  modes: { inquiry: true, instant: true },
  icalImports: [],
  icalToken: "zmente-tento-token",
};

/** Doplní chybějící klíče (např. po aktualizaci aplikace) výchozími hodnotami. */
export function withDefaults(partial: Partial<Settings> | null | undefined): Settings {
  const p = partial ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...p,
    tagline: { ...DEFAULT_SETTINGS.tagline, ...(p.tagline ?? {}) },
    petsNote: { ...DEFAULT_SETTINGS.petsNote, ...(p.petsNote ?? {}) },
    cancellationPolicy: { ...DEFAULT_SETTINGS.cancellationPolicy, ...(p.cancellationPolicy ?? {}) },
    modes: { ...DEFAULT_SETTINGS.modes, ...(p.modes ?? {}) },
    rooms: {
      "pokoj-2": { ...DEFAULT_SETTINGS.rooms["pokoj-2"], ...(p.rooms?.["pokoj-2"] ?? {}) },
      "pokoj-5": { ...DEFAULT_SETTINGS.rooms["pokoj-5"], ...(p.rooms?.["pokoj-5"] ?? {}) },
    },
    seasons: p.seasons ?? DEFAULT_SETTINGS.seasons,
    icalImports: p.icalImports ?? DEFAULT_SETTINGS.icalImports,
  };
}
