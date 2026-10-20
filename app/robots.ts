import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/*/rezervace/hotovo", "/*/rezervace/platba-dev"] }], sitemap: `${base}/sitemap.xml` };
}
