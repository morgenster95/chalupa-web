import Image from "next/image";
import Link from "next/link";
import { t, type Messages } from "@/lib/i18n";
import { formatCzk } from "@/lib/pricing";
import type { RoomInfo } from "@/lib/rooms";
import type { Settings } from "@/lib/types";
import Icon from "./Icon";

export default function RoomCard({ room, m, s, locale }: { room: RoomInfo; m: Messages; s: Settings; locale: string }) {
  const r = s.rooms[room.id];
  const text = m.rooms[room.id];
  const cap = r.maxGuests;
  return (
    <article className="group card flex flex-col overflow-hidden">
      <Link href={`/${locale}/pokoje/${room.slug}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={room.cover.src}
          alt={room.cover.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1.5 text-sm font-semibold text-wood shadow-soft">
          {m.rooms.from} {formatCzk(r.basePrice, locale)} <span className="font-normal text-muted">{m.rooms.perNight}</span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-2xl sm:text-[1.7rem]">{text.name}</h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sage-dark">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="users" className="h-4 w-4" />
            {t(cap >= 5 ? m.rooms.upTo5 : m.rooms.upTo, { n: cap })}
            {r.extraBedAvailable && ` ${m.rooms.extraBed}`}
          </span>
        </p>
        <p className="mt-3 leading-relaxed text-muted">{text.short}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <Link href={`/${locale}/rezervace?pokoj=${room.id}`} className="btn-primary">
            {m.nav.book}
          </Link>
          <Link href={`/${locale}/pokoje/${room.slug}`} className="btn-secondary">
            {m.rooms.detail}
          </Link>
        </div>
      </div>
    </article>
  );
}
