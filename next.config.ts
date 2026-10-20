import type { NextConfig } from "next";

// STATIC_EXPORT=1 → statický náhled pro GitHub Pages (bez serveru, rezervace jen jako ukázka)
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: isStatic,
  },
  poweredByHeader: false,
  devIndicators: false,
  ...(isStatic
    ? {
        output: "export" as const,
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
