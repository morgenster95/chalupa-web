import type { Metadata } from "next";
import Image from "next/image";
import { Sprig } from "@/components/Botanical";
import ContactForm from "@/components/ContactForm";
import Icon from "@/components/Icon";
import { getSettings } from "@/lib/db";
import { getMessages, type Locale } from "@/lib/i18n";
import { PHOTOS } from "@/lib/rooms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getMessages(locale).contact.title };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = getMessages(locale);
  const s = await getSettings();
  const mapQuery = encodeURIComponent(`${s.address}, ${s.municipality}`);
  return (
    <section className="container-x relative grid gap-10 py-10 md:grid-cols-[1fr_1.3fr] md:py-16">
      <Sprig name="chamomile" className="absolute -left-24 top-24 hidden h-96 w-auto -rotate-12 text-wood/[0.09] lg:block" />
      <div className="relative">
        <h1 className="text-4xl sm:text-5xl">{m.contact.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{m.contact.text}</p>
        <ul className="mt-8 space-y-5">
          <li className="flex gap-4">
            <span className="slice h-12 w-12 shrink-0">
              <Icon name="pin" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.contact.address}</p>
              <p className="font-semibold">
                {s.address}, {s.municipality}
              </p>
              <a href={`https://mapy.cz/zakladni?q=${mapQuery}`} target="_blank" rel="noopener" className="text-sm font-semibold text-honey-dark hover:underline">
                {m.contact.map} →
              </a>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="slice h-12 w-12 shrink-0">
              <Icon name="phone" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.contact.phoneLabel}</p>
              <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="font-semibold hover:text-honey-dark">
                {s.phone}
              </a>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="slice h-12 w-12 shrink-0">
              <Icon name="mail" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.contact.emailLabel}</p>
              <a href={`mailto:${s.email}`} className="font-semibold hover:text-honey-dark">
                {s.email}
              </a>
            </div>
          </li>
        </ul>
        <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-[2rem] md:block">
          <Image src={PHOTOS.exterior[1].src} alt={PHOTOS.exterior[1].alt} fill sizes="40vw" className="object-cover" />
        </div>
      </div>
      <div>
        <ContactForm locale={locale} m={m} turnstileKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </div>
    </section>
  );
}
