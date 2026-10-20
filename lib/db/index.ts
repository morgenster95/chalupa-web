import "server-only";
import { firestoreEnabled } from "../config";
import { DEFAULT_SETTINGS, withDefaults } from "../defaults";
import type { Settings } from "../types";
import type { Store } from "./store";

export { ConflictError } from "./store";

let store: Store | undefined;

export async function db(): Promise<Store> {
  if (!store) {
    store = firestoreEnabled() ? (await import("./firestore")).firestoreStore : (await import("./local")).localStore;
  }
  return store;
}

export async function getSettings(): Promise<Settings> {
  const s = await (await db()).getSettings();
  return s ? withDefaults(s) : DEFAULT_SETTINGS;
}
