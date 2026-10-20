# Návod: jak web dostat online

> **Náhled na GitHub Pages:** složka `docs/` obsahuje hotový statický náhled webu
> (`https://morgenster95.github.io/chalupa-web/`). Je to jen ukázka vzhledu: kalendář a výpočet ceny fungují,
> ale rezervace ani zprávy se neodesílají a administrace v náhledu není. Plný provoz poběží na Firebase.
> Zapnutí: na GitHubu **Settings → Pages → Source: Deploy from a branch → `main` / `/docs`**. Na bezplatném účtu
> musí být repozitář **veřejný**. Po změnách webu je potřeba náhled znovu sestavit
> (`STATIC_EXPORT=1 NEXT_PUBLIC_DEMO=1 NEXT_PUBLIC_BASE_PATH=/chalupa-web next build` bez složek `app/admin` a `app/api`, výstup `out/` → `docs/`).

Postupujte popořadě. Každý krok zabere 5–15 minut. Kde je napsáno **(volitelné)**, můžete krok přeskočit
a vrátit se k němu později. Web funguje i bez něj.

> 💡 **Tajné klíče** (API klíče, hesla) nikdy nepište do souborů v repozitáři. Ukládají se jako
> „secrets“ ve Firebase (krok 4).

---

## 0. Co budete potřebovat

- Google účet (pro Firebase a přihlášení do administrace)
- GitHub účet s repozitářem `chalupa-web` (už existuje)
- Platební kartu pro Firebase tarif **Blaze**. Při provozu chalupy se vejdete do bezplatných limitů, ale bez karty
  Firebase nedovolí spustit server. V kroku 1 si nastavíte upozornění na útratu.
- Na počítači **Node.js 20+** (https://nodejs.org → verze LTS). Potřeba jen pro příkazy v kroku 4.

---

## 1. Firebase projekt

1. Otevřete https://console.firebase.google.com → **Vytvořit projekt** (Create project).
2. Název např. `chalupa`. Google Analytics můžete vypnout.
3. Vlevo dole klikněte na **Spark** → **Upgrade** → tarif **Blaze** → přidejte platební účet.
4. **Upozornění na útratu:** https://console.cloud.google.com/billing → *Budgets & alerts* → *Create budget*.
   Nastavte částku např. 100 Kč měsíčně a upozornění e-mailem na 50 %, 90 % a 100 %.

## 2. Databáze Firestore

1. Ve Firebase vlevo **Build → Firestore Database → Create database**.
2. Umístění: **eur3 (Europe)** nebo `europe-west3 (Frankfurt)`. Později už nejde změnit.
3. Režim: **Production mode**.
4. Záložka **Rules**: vložte obsah souboru `firestore.rules` z repozitáře a klikněte **Publish**.
   (Databázi čte a zapisuje jen server, prohlížeč k ní přístup nemá.)

## 3. Přihlášení Googlem (Authentication)

1. **Build → Authentication → Get started → Sign-in method → Google → Enable**, vyplňte svůj e-mail, uložte.
2. **Project settings** (ozubené kolečko) → **General** → dole *Your apps* → ikona **`</>`** (Web).
   Název `chalupa-web`, Firebase Hosting **nezaškrtávejte** → *Register app*.
3. Zobrazí se `firebaseConfig`. Hodnoty zkopírujte do souboru **`apphosting.yaml`** (přímo na GitHubu: soubor
   otevřete → tužka ✏️ → upravit → *Commit changes*):

   | v apphosting.yaml | z firebaseConfig |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

   Tyto hodnoty nejsou tajné, mohou být v repozitáři.
4. Ve stejném souboru nastavte `ADMIN_EMAILS` na Google účty, které se smí přihlásit do administrace
   (oddělené čárkou).

## 4. Tajné klíče (secrets)

Na svém počítači otevřete příkazový řádek (Windows: *PowerShell*) a spusťte:

```bash
npm install -g firebase-tools
firebase login
firebase apphosting:secrets:set APP_SECRET --project VAS-PROJECT-ID
firebase apphosting:secrets:set CRON_SECRET --project VAS-PROJECT-ID
```

`VAS-PROJECT-ID` najdete ve Firebase v Project settings → *Project ID*. Přidávejte ho i k dalším příkazům
`firebase apphosting:secrets:set` v tomto návodu.

U každého secretu vložte **dlouhý náhodný řetězec**, třeba z https://www.random.org/strings/
(30+ znaků). Hodnotu `CRON_SECRET` si poznamenejte pro krok 8.

> Pokud se příkaz zeptá, jestli má udělit přístup backendu, odpovězte **Yes**. Když se nezeptá,
> přístup se udělí automaticky při vytvoření backendu v kroku 5.

## 5. Nasazení: Firebase App Hosting + GitHub

1. Ve Firebase **Build → App Hosting → Get started**.
2. Region: **europe-west4** (nebo nejbližší evropský).
3. **Connect to GitHub** → povolte přístup → vyberte repozitář **`chalupa-web`**.
4. Root directory: `/`, live branch: **`main`**, **Automatic rollouts: zapnuto**.
5. Název backendu: `chalupa` → **Finish and deploy**.
   Hned potom backendu povolte přístup k secrets z kroku 4:
   ```bash
   firebase apphosting:secrets:grantaccess APP_SECRET,CRON_SECRET --backend chalupa --project VAS-PROJECT-ID
   ```
   Pokud první nasazení mezitím selhalo, klikněte u backendu na **Create rollout**, nebo udělejte jakýkoli commit.
   Stejně postupujte u dalších secrets (Resend, Stripe).
6. Za 5–10 minut je web online na adrese typu `https://chalupa--VASPROJEKT.europe-west4.hosted.app`.
7. Tuto adresu zapište do `apphosting.yaml` jako `SITE_URL` a uložte (commit). Web se sám znovu nasadí.
   Stejně to funguje i dál: **každá změna na GitHubu = nové nasazení**.
8. Otevřete `https://VASE-ADRESA/admin` → *Přihlásit se přes Google*.
9. V administraci → **Ceník a nastavení** vyplňte skutečné údaje: název, adresu, telefon, e-mail, ceny,
   IBAN, check-in/out, storno podmínky, zvířata.

> ⚠️ Pokud přihlášení hlásí *unauthorized domain*: **Authentication → Settings → Authorized domains → Add domain**
> a přidejte adresu webu (bez `https://`).

## 6. E-maily: Resend

1. Registrace na https://resend.com.
2. **Domains → Add domain**: zadejte svou doménu (např. `chalupa-xy.cz`). Resend ukáže 3–4 DNS záznamy.
   Ty přidejte u svého registrátora domény (Wedos, Forpsi, Active24…) a klikněte **Verify**.
   *Bez vlastní domény* jde posílat jen testovací e-maily na vlastní adresu, se kterou jste se registrovali.
3. **API Keys → Create API key** (Permission: *Sending access*) → zkopírujte `re_...`.
4. `firebase apphosting:secrets:set RESEND_API_KEY` → vložte klíč.
5. V `apphosting.yaml` odkomentujte (smažte `# ` na začátku) řádky `RESEND_API_KEY` a nastavte `EMAIL_FROM`,
   např. `Chalupa pod Oborou <rezervace@chalupa-xy.cz>`. Commit → nasadí se.
6. Test: na webu odešlete nezávaznou poptávku. Majiteli (e-mail z nastavení) přijde e-mail s tlačítky
   **Potvrdit / Odmítnout**, hostovi potvrzení přijetí.

## 7. Platby kartou: Stripe (nejdřív testovací režim)

1. Registrace na https://dashboard.stripe.com/register. Vpravo nahoře musí svítit **Test mode / Sandbox**.
2. **Developers → API keys** → *Secret key* (`sk_test_...`) →
   `firebase apphosting:secrets:set STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://VASE-ADRESA/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   - po uložení zkopírujte **Signing secret** (`whsec_...`) → `firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET`
4. V `apphosting.yaml` odkomentujte řádky `STRIPE_SECRET_KEY` a `STRIPE_WEBHOOK_SECRET` → commit.
5. **Test:** na webu zvolte *Rezervovat a zaplatit hned* a zaplaťte testovací kartou
   `4242 4242 4242 4242`, libovolné datum v budoucnosti, CVC `123`. Rezervace se sama potvrdí a přijdou e-maily.
6. **Ostrý provoz:** ve Stripe dokončete *Activate account* (údaje o firmě/živnosti, bankovní účet),
   přepněte se z testovacího režimu, vytvořte stejný webhook znovu a přepište oba secrets ostrými klíči
   (`sk_live_...`, nový `whsec_...`). Apple Pay a Google Pay jsou v Stripe Checkout zapnuté automaticky
   (Settings → Payment methods).

## 8. Pravidelná údržba (cron)

Uvolňuje propadlé poptávky po 48 h a stahuje obsazenost z Bookingu/Airbnb.

1. https://console.cloud.google.com/cloudscheduler (vyberte Firebase projekt) → **Create job**.
2. Název `chalupa-cron`, region `europe-west1`, frekvence `*/30 * * * *`, časové pásmo `Europe/Prague`.
3. Target: **HTTP**, URL `https://VASE-ADRESA/api/cron`, metoda **GET**,
   hlavička `Authorization` s hodnotou `Bearer VAS_CRON_SECRET`.
4. Uložit → *Force run* → ve sloupci *Last run* má být *Success*.

(Tři úlohy Cloud Scheduler jsou zdarma.)

## 9. Booking.com a Airbnb (volitelné)

Administrace → **Booking / Airbnb**:
- **Export:** zkopírujte adresu pro každý pokoj a vložte ji v Bookingu (*Kalendář → Synchronizace kalendářů*)
  a Airbnb (*Kalendář → Dostupnost → Propojit kalendáře*).
- **Import:** v Bookingu/Airbnb zkopírujte „Export kalendáře“ (.ics) a vložte ho sem.

Portály kalendáře obnovují zhruba každé 1–3 hodiny, takže krátce po sobě může přijít kolize. Administrace ji označí.

## 10. Vlastní doména (volitelné)

1. Firebase → App Hosting → backend → **Settings → Domains → Add custom domain** → DNS záznamy u registrátora.
2. Doménu přidejte do **Authentication → Settings → Authorized domains**.
3. Změňte `SITE_URL` v `apphosting.yaml` a URL webhooku ve Stripe.

## 11. Ochrana formuláře: Cloudflare Turnstile (volitelné)

Kontaktní formulář má i bez toho skryté pole proti robotům, kontrolu rychlosti vyplnění a limit odeslání.
Pokud by přesto chodil spam: https://dash.cloudflare.com → Turnstile → *Add site* → do `apphosting.yaml` doplňte
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` a přes `firebase apphosting:secrets:set TURNSTILE_SECRET_KEY` tajný klíč.

---

## Lokální vývoj s ostrou databází (pro pokročilé)

```bash
cp .env.example .env.local    # a doplňte hodnoty
npm install && npm run dev
```

Pro připojení k Firestore z počítače: Firebase → Project settings → **Service accounts → Generate new private key**
a obsah JSON vložte do `FIREBASE_SERVICE_ACCOUNT` v `.env.local`. Soubor nikdy nenahrávejte na GitHub.

## Kolik to stojí

| Služba | Cena |
|---|---|
| Firebase App Hosting + Firestore | v bezplatných limitech tarifu Blaze 0 Kč, s rezervou pro tisíce návštěv měsíčně |
| Cloud Scheduler | 3 úlohy zdarma |
| Resend | zdarma do 3 000 e-mailů/měsíc |
| Stripe | žádný měsíční poplatek, jen poplatek z každé platby kartou |
| Doména .cz | cca 200–300 Kč/rok |
