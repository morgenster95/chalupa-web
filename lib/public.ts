import "server-only";
import type { PublicSettings } from "@/components/BookingWidget";
import { devShortcuts, stripeEnabled } from "./config";
import type { Settings } from "./types";

export function publicSettings(s: Settings): PublicSettings {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { icalToken, icalImports, ...rest } = s;
  return rest;
}

/** Je okamžitá platba dostupná (Stripe nastaven, nebo lokální simulace)? */
export const instantReady = () => stripeEnabled() || devShortcuts();
