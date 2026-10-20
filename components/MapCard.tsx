import type { Settings } from "@/lib/types";
import Icon from "./Icon";

// Mapa z OpenStreetMap (bez API klíče) v papírovém rámečku + odkazy na navigaci.
export default function MapCard({ s, labels, className = "" }: { s: Settings; labels: { open: string; navigate: string; alt: string }; className?: string }) {
  const { lat, lng } = s;
  const dLat = 0.012;
  const dLng = 0.022;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(5)).join(",");
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const mapy = `https://mapy.com/fnc/v1/showmap?mapset=outdoor&center=${lng},${lat}&zoom=15&marker=true`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className={className}>
      <div className="framed rotate-[0.6deg]">
        <span className="tape -top-3 left-8 -rotate-6" />
        <span className="tape -top-3 right-8 rotate-[5deg]" />
        <div className="relative aspect-[4/3] overflow-hidden bg-cream sm:aspect-[16/10]">
          <iframe
            src={embed}
            title={labels.alt}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 [filter:sepia(0.28)_saturate(0.85)_contrast(0.97)]"
          />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={mapy} target="_blank" rel="noopener" className="btn-secondary">
          <Icon name="pin" className="h-4 w-4" />
          {labels.open}
        </a>
        <a href={directions} target="_blank" rel="noopener" className="btn-secondary">
          <Icon name="arrow" className="h-4 w-4" />
          {labels.navigate}
        </a>
      </div>
    </div>
  );
}
