import type { MetadataRoute } from "next";
import { ROOM_LIST } from "@/lib/rooms";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const paths = ["", "/rezervace", "/kontakt", "/podminky", ...ROOM_LIST.map((r) => `/pokoje/${r.slug}`)];
  return paths.map((p) => ({
    url: `${base}/cs${p}`,
    alternates: { languages: { cs: `${base}/cs${p}`, en: `${base}/en${p}`, de: `${base}/de${p}` } },
  }));
}
