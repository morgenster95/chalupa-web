import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Settings } from "@/lib/types";
import Icon from "./Icon";

export default function Footer({ locale, m, s }: { locale: string; m: Messages; s: Settings }) {
  return (
    <footer className="mt-24 border-t border-line bg-cream/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-wood">{s.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{s.tagline[locale as keyof typeof s.tagline]}</p>
        </div>
        <div className="space-y-2.5 text-sm">
          <p className="flex items-start gap-2.5">
            <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-sage-dark" />
            <span>
              {s.address}
              <br />
              {s.municipality}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="phone" className="h-4 w-4 text-sage-dark" />
            <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-honey-dark">
              {s.phone}
            </a>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="mail" className="h-4 w-4 text-sage-dark" />
            <a href={`mailto:${s.email}`} className="hover:text-honey-dark">
              {s.email}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          <Link href={`/${locale}/rezervace`} className="font-semibold text-honey-dark hover:underline">
            {m.nav.book} →
          </Link>
          <Link href={`/${locale}/podminky`} className="text-muted hover:text-wood">
            {m.footer.terms}
          </Link>
          <Link href={`/${locale}/kontakt`} className="text-muted hover:text-wood">
            {m.nav.contact}
          </Link>
        </div>
      </div>
      <div className="border-t border-line/70">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {s.name}. {m.footer.rights}
          </span>
          <Link href="/admin" className="hover:text-wood" prefetch={false}>
            {m.footer.admin}
          </Link>
        </div>
      </div>
    </footer>
  );
}
