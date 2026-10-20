import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BotanicalSprite } from "@/components/Botanical";
import { getMessages, isLocale, LOCALES } from "@/lib/i18n";
import { getSettings } from "@/lib/db";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#fbf8f2" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();
  const base = process.env.SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: `${s.name} | ${m.meta.title}`, template: `%s | ${s.name}` },
    description: m.meta.description,
    alternates: { languages: { cs: "/cs", en: "/en", de: "/de" } },
    openGraph: { type: "website", siteName: s.name, images: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/fotky/pokoj5-1.jpg`], locale },
    icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg` },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const s = await getSettings();
  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col">
        <BotanicalSprite />
        <Header locale={locale} name={s.name} nav={m.nav} />
        <main className="flex-1 overflow-x-clip">{children}</main>
        <Footer locale={locale} m={m} s={s} />
      </body>
    </html>
  );
}
