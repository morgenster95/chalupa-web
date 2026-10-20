import "../globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/auth";
import { devShortcuts, firestoreEnabled, resendEnabled, stripeEnabled } from "@/lib/config";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = { title: "Správa chalupy", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Rezervace" },
  { href: "/admin/obsazenost", label: "Obsazenost a blokace" },
  { href: "/admin/nastaveni", label: "Ceník a nastavení" },
  { href: "/admin/ical", label: "Booking / Airbnb" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  const warnings = [
    !firestoreEnabled() && "Data se ukládají jen lokálně (.data/db.json) – Firebase není připojen.",
    !resendEnabled() && "Resend není nastaven – e-maily se neodesílají" + (devShortcuts() ? " (najdete je ve Vývojové poště)." : "."),
    !stripeEnabled() && "Stripe není nastaven – platba kartou " + (devShortcuts() ? "se jen simuluje." : "je vypnutá."),
  ].filter(Boolean) as string[];

  return (
    <html lang="cs">
      <body className="min-h-dvh bg-cream/50">
        {admin && (
          <header className="border-b border-line bg-paper">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
              <Link href="/admin" className="font-serif text-xl text-wood">
                Správa chalupy
              </Link>
              <nav className="flex flex-wrap gap-1 text-sm font-semibold">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-wood/80 hover:bg-cream hover:text-wood">
                    {n.label}
                  </Link>
                ))}
                {devShortcuts() && (
                  <Link href="/admin/posta" className="rounded-full px-3 py-1.5 text-wood/80 hover:bg-cream hover:text-wood">
                    Vývojová pošta
                  </Link>
                )}
              </nav>
              <div className="ml-auto flex items-center gap-3 text-sm text-muted">
                <Link href="/" target="_blank" className="hover:text-wood">
                  Web ↗
                </Link>
                <span className="hidden sm:inline">{admin.email}</span>
                <LogoutButton />
              </div>
            </div>
            {warnings.length > 0 && (
              <div className="bg-honey-light/60 px-4 py-2 text-center text-xs text-honey-dark sm:px-6">{warnings.join(" · ")}</div>
            )}
          </header>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
