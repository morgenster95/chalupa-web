"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";

interface Props {
  locale: string;
  name: string;
  nav: { home: string; rooms: string; surroundings: string; gallery: string; contact: string; book: string; menu: string; close: string };
}

const LOCALES = [
  { code: "cs", label: "CZ" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export default function Header({ locale, name, nav }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const base = `/${locale}`;
  const links = [
    { href: `${base}#pokoje`, label: nav.rooms },
    { href: `${base}#okoli`, label: nav.surroundings },
    { href: `${base}#galerie`, label: nav.gallery },
    { href: `${base}/kontakt`, label: nav.contact },
  ];
  const rest = pathname.split("/").slice(2).join("/");
  const switchHref = (code: string) => `/${code}${rest ? "/" + rest : ""}`;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background,box-shadow] duration-300 ${
        scrolled || open ? "bg-paper/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur" : "bg-paper/60 backdrop-blur-sm"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href={base} className="flex items-center gap-2.5 text-wood">
          <span className="slice h-10 w-10">
            <Icon name="home" className="h-5 w-5" />
          </span>
          <span className="font-serif text-lg font-semibold leading-tight md:text-xl">{name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Hlavní menu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[0.95rem] font-semibold text-wood/80 transition hover:text-honey-dark">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1 text-xs font-bold">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={switchHref(l.code)}
                onClick={() => (document.cookie = `lang=${l.code};path=/;max-age=31536000`)}
                className={`rounded-md px-2 py-1 ${l.code === locale ? "bg-cream text-wood" : "text-muted hover:text-wood"}`}
                hrefLang={l.code}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <Link href={`${base}/rezervace`} className="btn-primary !px-5 !py-2.5">
            {nav.book}
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-full text-wood md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? nav.close : nav.menu}
        >
          <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="container-x flex flex-col py-3" aria-label="Mobilní menu">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line/60 py-3.5 font-serif text-lg text-wood">
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between py-4">
              <div className="flex gap-1 text-sm font-bold">
                {LOCALES.map((l) => (
                  <Link
                    key={l.code}
                    href={switchHref(l.code)}
                    onClick={() => (document.cookie = `lang=${l.code};path=/;max-age=31536000`)}
                    className={`rounded-md px-3 py-1.5 ${l.code === locale ? "bg-cream text-wood" : "text-muted"}`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <Link href={`${base}/rezervace`} className="btn-primary !py-2.5">
                {nav.book}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
