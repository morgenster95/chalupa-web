import type { RoomId } from "./types";

export interface Photo {
  src: string;
  w: number;
  h: number;
  alt: string;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const p = (name: string, w: number, h: number, alt: string): Photo => ({ src: `${BASE}/fotky/${name}.jpg`, w, h, alt });
const L = (name: string, alt: string) => p(name, 1280, 960, alt);
const P = (name: string, alt: string) => p(name, 960, 1280, alt);

// Rozřazení fotek. Pokud je některá fotka u špatného pokoje, stačí ji přesunout zde.
export const PHOTOS = {
  // Hlavní fotka nahoře na webu – ideálně celá chalupa na šířku. Novou fotku stačí uložit do public/fotky a změnit název zde.
  hero: P("exterier-2", "Chalupa se zahradou"),
  exterior: [P("exterier-1", "Chalupa se zahradou na jaře"), P("exterier-2", "Zahrada za chalupou")],
  deer: P("obora", "Jeleni v oboře na kraji lesa"),
  kitchen: P("kuchynka", "Kuchyňský kout"),
  details: [P("detail-stul", "Stůl s kyticí"), P("detail-povleceni", "Čisté povlečení a ručníky"), P("detail-postel", "Postel s polštářem")],
};

export interface RoomInfo {
  id: RoomId;
  slug: string;
  cover: Photo;
  photos: Photo[];
  sort: number;
}

export const ROOMS: Record<RoomId, RoomInfo> = {
  "pokoj-2": {
    id: "pokoj-2",
    slug: "pokoj-pro-2",
    sort: 1,
    cover: L("pokoj2-2", "Pokoj pro dva s manželskou postelí"),
    photos: [
      L("pokoj2-2", "Pokoj pro dva s manželskou postelí"),
      L("pokoj2-1", "Manželská postel a křeslo"),
      L("pokoj2-3", "Pohled do koupelny"),
      P("pokoj2-koupelna", "Koupelna se sprchovým koutem"),
      P("kuchynka", "Kuchyňský kout ve společných prostorách"),
    ],
  },
  "pokoj-5": {
    id: "pokoj-5",
    slug: "rodinny-pokoj",
    sort: 2,
    cover: L("pokoj5-1", "Podkrovní rodinný pokoj s jídelním stolem"),
    photos: [
      L("pokoj5-1", "Podkrovní pokoj s jídelním stolem"),
      L("pokoj5-2", "Pohled přes celý pokoj"),
      L("pokoj5-3", "Postele a jídelní kout"),
      L("pokoj5-4", "Dvě postele pod trámy"),
      L("pokoj5-5", "Postele pod šikmým stropem"),
      P("pokoj5-6", "Připravené ručníky na posteli"),
      P("pokoj5-7", "Dřevěné vyřezávané postele"),
      P("pokoj5-8", "Postel s noční lampičkou"),
      P("pokoj5-9", "Polštář s bylinkovým motivem"),
      P("pokoj5-10", "Postele pod střešním oknem"),
      P("pokoj5-koupelna-1", "Koupelna se sprchovým boxem"),
      L("pokoj5-koupelna-2", "Koupelna s umyvadlem"),
      P("kuchynka", "Kuchyňský kout"),
    ],
  },
};

export const ROOM_LIST = Object.values(ROOMS).sort((a, b) => a.sort - b.sort);

export function roomBySlug(slug: string): RoomInfo | undefined {
  return ROOM_LIST.find((r) => r.slug === slug);
}

export const GALLERY: Photo[] = [
  PHOTOS.exterior[0],
  ROOMS["pokoj-5"].photos[0],
  PHOTOS.deer,
  ROOMS["pokoj-2"].photos[0],
  PHOTOS.details[1],
  ROOMS["pokoj-5"].photos[1],
  PHOTOS.details[0],
  ROOMS["pokoj-2"].photos[3],
  PHOTOS.exterior[1],
  ROOMS["pokoj-5"].photos[2],
  PHOTOS.kitchen,
  ROOMS["pokoj-5"].photos[10],
];
