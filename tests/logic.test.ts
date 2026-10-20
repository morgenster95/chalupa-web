import { test } from "node:test";
import assert from "node:assert/strict";
import { calculatePrice, validateStay, surchargeFor } from "../lib/pricing.ts";
import { DEFAULT_SETTINGS, withDefaults } from "../lib/defaults.ts";
import { buildSpayd, isValidIban, czAccountFromIban } from "../lib/spayd.ts";
import { buildIcal, parseIcalNights } from "../lib/ical.ts";
import { inMonthDayRange, mergeNights, nightsBetween, diffDays } from "../lib/dates.ts";
import type { Settings } from "../lib/types.ts";

const flat: Settings = withDefaults({ seasons: [], weekendSurchargePercent: 0, depositPercent: 30 });

test("noci mezi daty", () => {
  assert.deepEqual(nightsBetween("2026-12-30", "2027-01-02"), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  assert.equal(diffDays("2026-02-27", "2026-03-02"), 3);
});

test("sezóna přes přelom roku", () => {
  assert.equal(inMonthDayRange("2026-12-28", "12-23", "01-01"), true);
  assert.equal(inMonthDayRange("2027-01-01", "12-23", "01-01"), true);
  assert.equal(inMonthDayRange("2027-01-02", "12-23", "01-01"), false);
});

test("cena pokoje pro 2 s přistýlkou", () => {
  const p = calculatePrice(flat, { roomId: "pokoj-2", from: "2026-11-02", to: "2026-11-05", adults: 2, children: 1, extraBed: true });
  assert.equal(p.nights, 3);
  assert.equal(p.accommodation, 3 * 1400);
  assert.equal(p.extraBed, 3 * 350);
  assert.equal(p.extraPersons, 0);
  assert.equal(p.cityTax, 2 * 3 * 30); // dítě osvobozeno
  assert.equal(p.total, 4200 + 1050 + 500 + 180);
  assert.equal(p.deposit, Math.round(p.total * 0.3));
});

test("pokoj pro 5 – příplatek za 5. osobu", () => {
  const p = calculatePrice(flat, { roomId: "pokoj-5", from: "2026-11-02", to: "2026-11-04", adults: 5, children: 0, extraBed: false });
  assert.equal(p.extraPersons, 400 * 2);
});

test("víkend a sezóna", () => {
  const s = withDefaults({});
  assert.equal(surchargeFor(s, "2026-07-10"), 15 + 10); // pátek v létě
  assert.equal(surchargeFor(s, "2026-07-12"), 15); // neděle
});

test("validace", () => {
  const base = { roomId: "pokoj-2" as const, from: "2026-11-02", to: "2026-11-03", adults: 2, children: 0, extraBed: false };
  assert.equal(validateStay(DEFAULT_SETTINGS, base), "min_nights");
  assert.equal(validateStay(DEFAULT_SETTINGS, { ...base, to: "2026-11-04", children: 1 }), "too_many_guests");
  assert.equal(validateStay(DEFAULT_SETTINGS, { ...base, to: "2026-11-04", children: 1, extraBed: true }), null);
  assert.equal(validateStay(DEFAULT_SETTINGS, { ...base, roomId: "pokoj-5", to: "2026-11-04", extraBed: true }), "extra_bed_unavailable");
  assert.equal(validateStay(DEFAULT_SETTINGS, { ...base, to: "2026-11-01" }), "invalid_dates");
});

test("SPAYD a IBAN", () => {
  assert.equal(isValidIban("CZ65 0800 0000 1920 0014 5399"), true);
  assert.equal(isValidIban("CZ65 0800 0000 1920 0014 5398"), false);
  assert.equal(czAccountFromIban("CZ6508000000192000145399"), "19-2000145399/0800");
  const s = buildSpayd({ iban: "CZ65 0800 0000 1920 0014 5399", amount: 1234, variableSymbol: "26123456", message: "Záloha – Pokoj*2", recipientName: "Chalupa" });
  assert.equal(s, "SPD*1.0*ACC:CZ6508000000192000145399*AM:1234.00*CC:CZK*MSG:ZALOHA - POKOJ 2*RN:CHALUPA*X-VS:26123456");
});

test("iCal export/import", () => {
  const nights = ["2026-11-02", "2026-11-03", "2026-11-10"];
  assert.deepEqual(mergeNights(nights), [{ from: "2026-11-02", to: "2026-11-04" }, { from: "2026-11-10", to: "2026-11-11" }]);
  const ics = buildIcal({ calName: "Pokoj", uidDomain: "x.cz", nights, summary: "Obsazeno" });
  assert.deepEqual(parseIcalNights(ics), nights);
  const airbnb = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261224\r\nDTEND;VALUE=DATE:20261227\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261230\r\nDTEND;VALUE=DATE:20261231\r\nSTATUS:CANCELLED\r\nEND:VEVENT\r\nEND:VCALENDAR";
  assert.deepEqual(parseIcalNights(airbnb), ["2026-12-24", "2026-12-25", "2026-12-26"]);
});
