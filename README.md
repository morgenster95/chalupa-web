# Chalupa – web s rezervacemi

Web pro pronájem dvou pokojů na chalupě: prezentace, galerie, kalendář obsazenosti, online rezervace
(nezávazná poptávka s QR platbou **nebo** okamžitá platba kartou přes Stripe), administrace a synchronizace
s Bookingem/Airbnb přes iCal. Česky, anglicky a německy.

**Technologie:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Firebase (App Hosting, Firestore, Authentication) ·
Stripe Checkout · Resend · QR Platba (SPAYD)

➡️ **Návod k nastavení a spuštění online: [NASTAVENI.md](./NASTAVENI.md)**

## Rychlý start (lokálně)

```bash
npm install
npm run dev
```

Otevřete http://localhost:3000. Bez jakýchkoli klíčů běží web v **lokálním režimu**:

- data se ukládají do `.data/db.json`,
- e-maily se neodesílají, ale najdete je v administraci → **Vývojová pošta**,
- platba kartou se jen simuluje,
- do administrace (http://localhost:3000/admin) se vstoupí tlačítkem bez hesla.

## Struktura

```
app/[locale]/            veřejný web (cs / en / de)
  page.tsx               úvod
  pokoje/[slug]/         detail pokoje + kalendář
  rezervace/             rezervační formulář, stránka „hotovo“, simulace platby
  kontakt/, podminky/
app/admin/               administrace (přihlášení Googlem)
app/api/                 rezervace, dostupnost, Stripe webhook, QR kód, iCal, cron, kontakt
components/              UI komponenty (kalendář, rezervační widget, galerie…)
lib/                     logika: ceny, SPAYD, iCal, databáze, e-maily, Stripe, přihlášení
messages/                texty webu v cs / en / de
public/fotky/            fotografie
```

### Kde co upravit

| Co | Kde |
|---|---|
| Ceny, sezóny, záloha, IBAN, kontakty, storno podmínky | Administrace → **Ceník a nastavení** (bez úpravy kódu) |
| Texty webu | `messages/cs.ts`, `messages/en.ts`, `messages/de.ts` |
| Přiřazení fotek k pokojům, galerie | `lib/rooms.ts` |
| Barvy a písma | `app/globals.css` (sekce `@theme`) |

### Ochrana proti dvojí rezervaci

Každá noc každého pokoje je v databázi samostatný dokument s pevným ID (`nights/pokoj-2_2026-11-20`).
Rezervace všechny své noci vytváří v jedné transakci. Když některá noc už existuje, transakce selže
a host dostane hlášku, že termín se právě obsadil. Stejně fungují ruční blokace i importy z Bookingu/Airbnb.

## Testy

```bash
npm test          # výpočet ceny, QR platba (SPAYD), IBAN, iCal
npm run typecheck
```
