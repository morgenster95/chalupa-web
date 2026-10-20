"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Photo } from "@/lib/rooms";
import Icon from "./Icon";

export default function Gallery({ photos, variant = "masonry" }: { photos: Photo[]; variant?: "masonry" | "room" }) {
  const [idx, setIdx] = useState<number | null>(null);
  const close = useCallback(() => setIdx(null), []);
  const go = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (idx === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", on);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", on);
      document.body.style.overflow = "";
    };
  }, [idx, close, go]);

  return (
    <>
      {variant === "masonry" ? (
        <div className="columns-2 gap-3 sm:gap-4 md:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
          {photos.map((p, i) => (
            <button key={p.src + i} onClick={() => setIdx(i)} className="group block w-full overflow-hidden rounded-sm border border-wood/10 bg-[#fffdf8] p-1.5 shadow-print sm:p-2">
              <Image
                src={p.src}
                alt={p.alt}
                width={p.w}
                height={p.h}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="h-auto w-full transition duration-500 group-hover:opacity-90"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, i) => (
            <button
              key={p.src + i}
              onClick={() => setIdx(i)}
              className={`group relative overflow-hidden rounded-sm bg-cream shadow-print ring-4 ring-[#fffdf8] ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto" : "aspect-square"}`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                priority={i === 0}
              />
            </button>
          ))}
        </div>
      )}

      {idx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1813]/92 p-3 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" onClick={close}>
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[idx].src} alt={photos[idx].alt} fill sizes="100vw" className="object-contain" />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white/90">
            {photos[idx].alt} · {idx + 1}/{photos.length}
          </p>
          <button onClick={close} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Zavřít">
            <Icon name="close" className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Předchozí"
          >
            <Icon name="chevronLeft" className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Další"
          >
            <Icon name="chevronRight" className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
