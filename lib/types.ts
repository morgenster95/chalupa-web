export const ROOM_IDS = ["pokoj-2", "pokoj-5"] as const;
export type RoomId = (typeof ROOM_IDS)[number];

export const LOCALES = ["cs", "en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized = Record<Locale, string>;

export interface RoomPricing {
  active: boolean;
  /** Cena za noc za pokoj (Kč) */
  basePrice: number;
  /** Kolik osob je v základní ceně */
  includedGuests: number;
  /** Maximální počet osob na běžných lůžkách */
  maxGuests: number;
  /** Příplatek za každou další osobu nad includedGuests (Kč/noc) */
  extraPersonPrice: number;
  extraBedAvailable: boolean;
  /** Cena přistýlky (Kč/noc) */
  extraBedPrice: number;
}

export interface Season {
  id: string;
  name: string;
  /** MM-DD, včetně */
  from: string;
  /** MM-DD, včetně */
  to: string;
  /** Přirážka v % (může být i záporná = sleva) */
  surchargePercent: number;
}

export interface IcalImport {
  id: string;
  roomId: RoomId;
  name: string;
  url: string;
}

export interface Settings {
  name: string;
  tagline: Localized;
  address: string;
  municipality: string;
  /** Poloha na mapě (GPS, desetinné stupně) */
  lat: number;
  lng: number;
  email: string;
  phone: string;
  iban: string;
  accountName: string;
  checkIn: string;
  checkOut: string;
  petsAllowed: boolean;
  petsNote: Localized;
  minNights: number;
  cleaningFee: number;
  /** Poplatek z pobytu Kč / osoba / noc */
  cityTax: number;
  /** Děti (do 18 let) jsou od poplatku osvobozeny */
  cityTaxChildrenExempt: boolean;
  /** Přirážka za noci pá→so a so→ne v % */
  weekendSurchargePercent: number;
  seasons: Season[];
  rooms: Record<RoomId, RoomPricing>;
  /** Záloha u platby převodem v % (0 = platí se celá částka) */
  depositPercent: number;
  /** Do kolika dnů od potvrzení zaplatit */
  paymentDueDays: number;
  /** Jak dlouho drží nezávazná poptávka termín (hodiny) */
  holdHours: number;
  cancellationPolicy: Localized;
  modes: { inquiry: boolean; instant: boolean };
  icalImports: IcalImport[];
  /** Tajný token pro export iCal adres */
  icalToken: string;
}

export interface PriceNight {
  date: string;
  price: number;
}

export interface PriceBreakdown {
  nights: number;
  nightly: PriceNight[];
  accommodation: number;
  extraPersons: number;
  extraBed: number;
  cleaning: number;
  cityTax: number;
  total: number;
  deposit: number;
}

export type BookingMode = "inquiry" | "instant";
export type BookingStatus =
  | "pending" // poptávka čeká na majitele (termín držen)
  | "awaiting_payment" // okamžitá rezervace čeká na Stripe
  | "confirmed"
  | "declined"
  | "cancelled"
  | "expired"
  | "conflict"; // zaplaceno, ale termín mezitím obsazen – nutný ruční zásah
export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded";

export interface Guest {
  name: string;
  email: string;
  phone: string;
  note: string;
}

export interface HistoryEntry {
  at: string;
  action: string;
  by: string;
}

export interface Booking {
  id: string;
  roomId: RoomId;
  from: string;
  to: string;
  adults: number;
  children: number;
  extraBed: boolean;
  guest: Guest;
  locale: Locale;
  mode: BookingMode;
  price: PriceBreakdown;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  /** ISO čas, do kdy je termín držen (null = drží se natrvalo / nedrží) */
  holdUntil: string | null;
  paymentDue: string | null;
  variableSymbol: string;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export type NightKind = "booking" | "block" | "ical";

export interface Night {
  roomId: RoomId;
  date: string;
  kind: NightKind;
  refId: string;
}

export interface Block {
  id: string;
  roomId: RoomId;
  from: string;
  to: string;
  note: string;
  createdAt: string;
}

export interface IcalStatus {
  at: string;
  results: { importId: string; name: string; ok: boolean; nights: number; conflicts: string[]; error?: string }[];
}
