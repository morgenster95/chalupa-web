import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Settings } from "@/lib/types";
import { Sprig, WoodGrain } from "./Botanical";
import Icon from "./Icon";

export default function Footer({ locale, m, s }: { locale: string; m: Messages; s: Settings }) {
  return (
    <footer className="relative mt-24 overflow-hidden border-t-4 border-[#2c1f14] bg-bark text-cream" style={{ backgroundImage: "linear-gradient(180deg, rgb(255 240 210 / 0.05), transparent 40%)" }}>
      <WoodGrain className="text-[#f3dfbd]/[0.07]" />
      <Sprig name="fern" className="absolute -right-10 -top-10 hidden h-80 w-auto rotate-[200deg] text-honey-light/[0.08] md:block" />
      <div className="container-x relative grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-honey-light">{s.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">{s.tagline[locale as keyof typeof s.tagline]}</p>
        </div>
        <div className="space-y-2.5 text-sm text-cream/90">
          <p className="flex items-start gap-2.5">
            <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-honey-light/80" />
            <span>
              {s.address}
              <br />
              {s.municipality}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="phone" className="h-4 w-4 text-honey-light/80" />
            <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-honey-light">
              {s.phone}
            </a>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="mail" className="h-4 w-4 text-honey-light/80" />
            <a href={`mailto:${s.email}`} className="hover:text-honey-light">
              {s.email}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          <Link href={`/${locale}/rezervace`} className="font-semibold text-honey-light hover:underline">
            {m.nav.book} →
          </Link>
          <Link href={`/${locale}/podminky`} className="text-cream/70 hover:text-cream">
            {m.footer.terms}
          </Link>
          <Link href={`/${locale}/kontakt`} className="text-cream/70 hover:text-cream">
            {m.nav.contact}
          </Link>
        </div>
      </div>
      <div className="relative border-t border-black/25 shadow-[inset_0_1px_0_rgb(255_240_210/0.06)]">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-cream/55">
          <span>
            © {new Date().getFullYear()} {s.name}. {m.footer.rights}
          </span>
          {process.env.NEXT_PUBLIC_DEMO !== "1" && (
            <Link href="/admin" className="hover:text-cream" prefetch={false}>
              {m.footer.admin}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
