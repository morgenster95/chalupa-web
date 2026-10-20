import Image from "next/image";
import Link from "next/link";
import Gallery from "@/components/Gallery";
import Icon from "@/components/Icon";
import RoomCard from "@/components/RoomCard";
import { getSettings } from "@/lib/db";
import { getMessages, type Locale } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import { GALLERY, PHOTOS, ROOM_LIST, ROOMS } from "@/lib/rooms";

const SURROUNDING_ICONS = ["swing", "tree", "deer", "city"];

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();
  const minPrice = Math.min(...ROOM_LIST.filter((r) => s.rooms[r.id].active).map((r) => s.rooms[r.id].basePrice));

  return (
    <>
      {/* HERO */}
      <section className="grain relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pb-24 md:pt-14">
          <div className="order-2 md:order-1">
            <p className="eyebrow">{m.home.eyebrow}</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.4rem]">{m.home.heroTitle}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{m.home.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/rezervace`} className="btn-primary">
                {m.home.heroCta}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}#pokoje`} className="btn-secondary">
                {m.home.heroCta2}
              </Link>
            </div>
            {Number.isFinite(minPrice) && (
              <p className="mt-8 text-sm text-muted">
                {m.rooms.from} <strong className="font-serif text-xl text-wood">{formatCzk(minPrice, locale)}</strong> {m.rooms.perNight}
              </p>
            )}
          </div>
          <div className="relative order-1 md:order-2">
            <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[2rem] shadow-soft md:w-[86%]">
              <Image src={PHOTOS.exterior[0].src} alt={PHOTOS.exterior[0].alt} fill priority sizes="(min-width: 768px) 45vw, 85vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 left-0 aspect-[4/3] w-[52%] overflow-hidden rounded-3xl border-[6px] border-paper shadow-soft md:-bottom-10">
              <Image src={ROOMS["pokoj-5"].cover.src} alt={ROOMS["pokoj-5"].cover.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="container-x grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[2rem] md:order-2">
          <Image src={PHOTOS.details[1].src} alt={PHOTOS.details[1].alt} fill sizes="(min-width: 768px) 30vw, 90vw" className="object-cover" />
        </div>
        <div className="md:order-1">
          <h2 className="text-4xl sm:text-5xl">{m.home.introTitle}</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">{m.home.introText1}</p>
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
      </section>

      {/* POKOJE */}
      <section id="pokoje" className="scroll-mt-24 bg-cream/70 py-16 md:py-24">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow">{m.nav.rooms}</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">{m.home.roomsTitle}</h2>
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
      <section className="container-x py-16 md:py-24">
        <h2 className="text-center text-4xl sm:text-5xl">{m.home.amenitiesTitle}</h2>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {m.home.amenities.map((a) => (
            <div key={a.title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-light text-sage-dark">
                <Icon name={a.icon} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl">{a.title}</h3>
                <p className="mt-1 leading-relaxed text-muted">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OKOLÍ */}
      <section id="okoli" className="scroll-mt-24 bg-sage-dark py-16 text-white md:py-24">
        <div className="container-x grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image src={PHOTOS.deer.src} alt={PHOTOS.deer.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-light/80">{m.nav.surroundings}</p>
            <h2 className="mt-3 text-4xl !text-white sm:text-5xl">{m.home.surroundingsTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{m.home.surroundingsText}</p>
            <ul className="mt-8 space-y-5">
              {m.home.surroundings.map((x, i) => (
                <li key={x.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-honey-light">
                    <Icon name={SURROUNDING_ICONS[i] ?? "tree"} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-serif text-xl">
                      {x.title} <span className="ml-1 rounded-full bg-honey/90 px-2.5 py-0.5 align-middle font-sans text-xs font-bold text-white">{x.time}</span>
                    </p>
                    <p className="mt-1 text-white/75">{x.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* GALERIE */}
      <section id="galerie" className="container-x scroll-mt-24 py-16 md:py-24">
        <h2 className="text-4xl sm:text-5xl">{m.home.galleryTitle}</h2>
        <div className="mt-10">
          <Gallery photos={GALLERY} />
        </div>
      </section>

      {/* CTA */}
      <section className="container-x">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-honey-light/70 px-6 py-14 text-center sm:px-12 md:py-20">
          <h2 className="text-4xl sm:text-5xl">{m.home.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{m.home.ctaText}</p>
          <Link href={`/${locale}/rezervace`} className="btn-primary mt-8">
            {m.home.ctaButton}
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
