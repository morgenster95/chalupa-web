import type { Block, Booking, Night, NightKind, RoomId, Settings } from "../types";

export class ConflictError extends Error {
  constructor(public dates: string[]) {
    super(`Termín je již obsazen: ${dates.join(", ")}`);
    this.name = "ConflictError";
  }
}

export interface Store {
  getSettings(): Promise<Partial<Settings> | null>;
  saveSettings(s: Settings): Promise<void>;

  getBooking(id: string): Promise<Booking | null>;
  listBookings(limit?: number): Promise<Booking[]>;
  findBookingByStripeSession(sessionId: string): Promise<Booking | null>;
  saveBooking(b: Booking): Promise<void>;
  /** Atomicky zablokuje noci a uloží rezervaci. Při kolizi vyhodí ConflictError. */
  createBooking(b: Booking, nights: string[]): Promise<void>;
  /** Rezervace s holdUntil < now (čekající poptávky / platby). */
  listExpiredHolds(nowIso: string): Promise<Booking[]>;

  /** Atomicky zablokuje noci. Při kolizi vyhodí ConflictError a nic nezapíše. */
  lockNights(roomId: RoomId, dates: string[], kind: NightKind, refId: string): Promise<void>;
  /** Uvolní noci, které patří danému refId. */
  releaseNights(roomId: RoomId, dates: string[], refId: string): Promise<void>;
  listNights(roomId: RoomId, from: string, to: string): Promise<Night[]>;

  listBlocks(): Promise<Block[]>;
  getBlock(id: string): Promise<Block | null>;
  saveBlock(b: Block): Promise<void>;
  deleteBlock(id: string): Promise<void>;

  /** Nahradí noci z jednoho iCal importu. Vrátí noci, které nešly zapsat kvůli kolizi. */
  replaceIcalNights(roomId: RoomId, importId: string, dates: string[]): Promise<{ conflicts: string[] }>;

  getMeta<T>(key: string): Promise<T | null>;
  setMeta<T>(key: string, value: T): Promise<void>;
}

export const nightId = (roomId: RoomId, date: string) => `${roomId}_${date}`;
