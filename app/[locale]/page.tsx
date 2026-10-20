import Image from "next/image";
import Link from "next/link";
import { Flourish, Sprig } from "@/components/Botanical";
import Gallery from "@/components/Gallery";
import Icon from "@/components/Icon";
import MapCard from "@/components/MapCard";
import RoomCard from "@/components/RoomCard";
import { getSettings } from "@/lib/db";
import { getMessages, type Locale } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import { GALLERY, PHOTOS, ROOM_LIST } from "@/lib/rooms";

const SURROUNDING_ICONS = ["swing", "tree", "deer", "city"];

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();
  const minPrice = Math.min(...ROOM_LIST.filter((r) => s.rooms[r.id].active).map((r) => s.rooms[r.id].basePrice));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Sprig name="fern" className="absolute -left-16 -top-6 h-[30rem] w-auto -rotate-12 text-sage-dark/[0.14] md:left-[-2rem] md:h-[36rem]" />
        <Sprig name="chamomile" className="absolute -right-10 top-4 hidden h-72 w-auto rotate-6 text-wood/[0.1] lg:block" />
        <div className="container-x relative pt-8 md:pt-12">
          <div className="grid items-end gap-6 md:grid-cols-[1.15fr_1fr] md:gap-12">
            <div>
              <p className="eyebrow">{m.home.eyebrow}</p>
              <h1 className="mt-4 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.4rem]">{m.home.heroTitle}</h1>
              <Flourish className="mt-5 -ml-1" />
            </div>
            <div className="md:pb-3">
              <p className="max-w-xl text-lg leading-relaxed text-muted">{m.home.heroText}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/rezervace`} className="btn-primary">
                  {m.home.heroCta}
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
                <Link href={`/${locale}#pokoje`} className="btn-secondary">
                  {m.home.heroCta2}
                </Link>
              </div>
              {Number.isFinite(minPrice) && (
                <p className="mt-5 text-sm text-muted">
                  {m.rooms.from} <strong className="font-serif text-xl text-wood">{formatCzk(minPrice, locale)}</strong> {m.rooms.perNight}
                </p>
              )}
            </div>
          </div>

          <div className="relative mt-10 pb-20 md:mt-12 md:pb-24">
            <div className="framed -rotate-[0.5deg]">
              <span className="tape -top-3 left-[12%] -rotate-[4deg]" />
              <span className="tape -top-3 right-[12%] rotate-[3deg]" />
              <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[3/2]">
                <Image
                  src={PHOTOS.hero.src}
                  alt={PHOTOS.hero.alt}
                  fill
                  priority
                  sizes="(min-width: 1152px) 1120px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: "50% 27%" }}
                />
              </div>
            </div>
          </div>
        </div>
        <Sprig name="meadow" preserve="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-14 w-full text-sage-dark/25 md:h-16" />
      </section>

      {/* INTRO */}
      <section className="relative overflow-hidden">
        <Sprig name="hawthorn" className="absolute -left-12 bottom-6 hidden h-56 w-auto -rotate-6 text-wood/[0.1] md:block" />
        <div className="container-x relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="framed mx-auto w-full max-w-sm -rotate-[1.5deg] md:order-2">
            <span className="tape -top-3 left-6 -rotate-6" />
            <span className="tape -bottom-3 right-6 rotate-[-4deg]" />
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image src={PHOTOS.details[1].src} alt={PHOTOS.details[1].alt} fill sizes="(min-width: 768px) 30vw, 90vw" className="object-cover" />
            </div>
          </div>
          <div className="md:order-1">
            <h2 className="text-4xl sm:text-5xl">{m.home.introTitle}</h2>
            <Flourish className="mt-4 -ml-1" />
            <p className="mt-5 text-lg leading-relaxed text-muted">{m.home.introText1}</p>
            <p className="mt-4 text-lg leading-relaxed text-muted">{m.home.introText2}</p>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-sage-dark">
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4" /> Check-in {s.checkIn} · Check-out {s.checkOut}
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="paw" className="h-4 w-4" /> {s.petsNote[locale]}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* POKOJE */}
      <section id="pokoje" className="linen relative scroll-mt-24 overflow-hidden border-y border-wood/10 bg-cream/70 py-16 md:py-24">
        <Sprig name="wheat" className="absolute -right-6 top-6 h-[22rem] w-auto rotate-[14deg] text-wood/[0.12]" />
        <Sprig name="clover" className="absolute -left-8 bottom-4 hidden h-72 w-auto -rotate-12 text-sage-dark/[0.14] md:block" />
        <div className="container-x relative">
          <div className="max-w-2xl">
            <p className="eyebrow">{m.nav.rooms}</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">{m.home.roomsTitle}</h2>
            <Flourish className="mt-4 -ml-1" />
            <p className="mt-4 text-lg text-muted">{m.home.roomsText}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            {ROOM_LIST.filter((r) => s.rooms[r.id].active).map((room) => (
              <RoomCard key={room.id} room={room} m={m} s={s} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* VYBAVENÍ */}
      <section className="relative overflow-hidden">
        <Sprig name="fern" className="absolute -right-14 top-10 hidden h-96 w-auto rotate-[24deg] text-sage-dark/[0.12] md:block" />
        <div className="container-x relative py-16 md:py-24">
          <h2 className="text-center text-4xl sm:text-5xl">{m.home.amenitiesTitle}</h2>
          <Flourish className="mx-auto mt-4 block" />
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {m.home.amenities.map((a) => (
              <div key={a.title} className="flex gap-4">
                <span className="slice h-14 w-14 shrink-0">
                  <Icon name={a.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xl">{a.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OKOLÍ */}
      <section id="okoli" className="relative scroll-mt-24 overflow-hidden bg-sage-dark py-16 text-white md:py-24" style={{ backgroundImage: "var(--tex-paper)" }}>
        <Sprig name="hawthorn" className="absolute -right-10 -top-4 h-60 w-auto rotate-[160deg] text-sage-light/[0.13]" />
        <Sprig name="wheat" className="absolute -bottom-10 left-[44%] hidden h-80 w-auto -rotate-6 text-sage-light/[0.1] md:block" />
        <div className="container-x relative grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="framed rotate-[-1.2deg] !bg-[#f4efe2]">
            <span className="tape -top-3 right-8 rotate-[5deg]" />
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src={PHOTOS.deer.src} alt={PHOTOS.deer.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-light/80">{m.nav.surroundings}</p>
            <h2 className="mt-3 text-4xl !text-white sm:text-5xl">{m.home.surroundingsTitle}</h2>
            <Flourish className="mt-4 -ml-1 !text-honey-light/70" />
            <p className="mt-4 text-lg leading-relaxed text-white/80">{m.home.surroundingsText}</p>
            <ul className="mt-8 space-y-5">
              {m.home.surroundings.map((x, i) => (
                <li key={x.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-honey-light/30 bg-white/5 text-honey-light">
                    <Icon name={SURROUNDING_ICONS[i] ?? "tree"} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-serif text-xl">
                      {x.title} <span className="ml-1 rounded-md bg-honey/90 px-2.5 py-0.5 align-middle font-sans text-xs font-bold text-white">{x.time}</span>
                    </p>
                    <p className="mt-1 text-white/75">{x.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="mapa" className="relative scroll-mt-24 overflow-hidden">
        <Sprig name="clover" className="absolute -left-10 top-10 hidden h-72 w-auto -rotate-12 text-sage-dark/[0.12] md:block" />
        <div className="container-x relative grid items-center gap-10 pt-16 md:grid-cols-[1fr_1.5fr] md:gap-14 md:pt-24">
          <div>
            <h2 className="text-4xl sm:text-5xl">{m.home.mapTitle}</h2>
            <Flourish className="mt-4 -ml-1" />
            <p className="mt-5 text-lg leading-relaxed text-muted">{m.home.mapText}</p>
            <p className="mt-6 flex items-start gap-3 font-semibold text-wood">
              <span className="slice h-11 w-11 shrink-0">
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <span className="pt-1">
                {s.address}
                <br />
                <span className="font-normal text-muted">{s.municipality}</span>
              </span>
            </p>
          </div>
          <MapCard s={s} labels={{ open: m.home.mapOpen, navigate: m.home.mapNavigate, alt: m.home.mapAlt }} />
        </div>
      </section>

      {/* GALERIE */}
      <section id="galerie" className="relative scroll-mt-24 overflow-hidden">
        <Sprig name="chamomile" className="absolute -right-8 top-4 h-64 w-auto rotate-[-8deg] text-wood/[0.1]" />
        <div className="container-x relative py-16 md:py-24">
          <h2 className="text-4xl sm:text-5xl">{m.home.galleryTitle}</h2>
          <Flourish className="mt-4 -ml-1" />
          <div className="mt-10">
            <Gallery photos={GALLERY} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x">
        <div className="kraft stitched relative overflow-hidden rounded-xl px-6 py-14 text-center shadow-print sm:px-12 md:py-20">
          <Sprig name="wheat" className="absolute -left-4 bottom-0 h-64 w-auto -rotate-[18deg] text-wood/[0.16] sm:left-4" />
          <Sprig name="wheat" className="absolute -right-4 bottom-0 h-64 w-auto -scale-x-100 rotate-[18deg] text-wood/[0.16] sm:right-4" />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl">{m.home.ctaTitle}</h2>
            <Flourish className="mx-auto mt-4 block !text-honey-dark" />
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink/70">{m.home.ctaText}</p>
            <Link href={`/${locale}/rezervace`} className="btn-primary mt-8">
              {m.home.ctaButton}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
