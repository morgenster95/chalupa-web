import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["cs", "en", "de"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) return NextResponse.next();

  // Výběr jazyka: uložená volba → jazyk prohlížeče (de/en) → čeština
  const saved = req.cookies.get("lang")?.value;
  let locale = saved && LOCALES.includes(saved) ? saved : "cs";
  if (!saved) {
    const al = (req.headers.get("accept-language") || "").toLowerCase();
    const primary = al.split(",")[0]?.trim().slice(0, 2);
    if (primary === "de") locale = "de";
    else if (primary === "en") locale = "en";
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // vše kromě API, administrace, interních cest Next.js a souborů s příponou
  matcher: ["/((?!api|admin|_next|fotky|favicon|robots|sitemap|.*\\..*).*)"],
};
