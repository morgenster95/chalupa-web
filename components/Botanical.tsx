// Herbářové kresby: tenké linky generované jednou do SVG spritu (BotanicalSprite v layoutu),
// na stránce se pak jen odkazují přes <use>, takže HTML zůstává malé.

type Pt = [number, number];

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = ([x, y]: Pt) => `${f(x)} ${f(y)}`;

// deterministický „náhodný“ generátor, ať je kresba při každém sestavení stejná
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const quadAngle = (a: Pt, c: Pt, b: Pt, t: number) =>
  Math.atan2(2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]), 2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]));
const along = ([x, y]: Pt, ang: number, l: number): Pt => [x + Math.cos(ang) * l, y + Math.sin(ang) * l];

// lístek s osou ve směru `ang`, délka l, poloviční šířka w
function leaf([x, y]: Pt, ang: number, l: number, w: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const T = (u: number, v: number) => `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`;
  return `M${T(0, 0)}C${T(l * 0.3, -w)} ${T(l * 0.8, -w * 0.8)} ${T(l, 0)}C${T(l * 0.8, w * 0.8)} ${T(l * 0.3, w)} ${T(0, 0)}`;
}
const seg = (a: Pt, b: Pt) => `M${pt(a)}L${pt(b)}`;
const circle = ([x, y]: Pt, r: number) => `M${f(x + r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0`;

// list se žilkami (hloh, buk)
function veinLeaf(p: Pt, ang: number, l: number, w: number) {
  let d = leaf(p, ang, l, w) + seg(p, along(p, ang, l * 0.92));
  for (const v of [0.28, 0.48, 0.68]) {
    const m = along(p, ang, l * v);
    d += seg(m, along(m, ang - 0.75, w * 0.85)) + seg(m, along(m, ang + 0.75, w * 0.85));
  }
  return d;
}

function fern() {
  const A: Pt = [100, 412];
  const C: Pt = [70, 230];
  const B: Pt = [118, 14];
  let d = `M${pt(A)}Q${pt(C)} ${pt(B)}`;
  const N = 15;
  for (let i = 0; i < N; i++) {
    const t = 0.07 + (i * 0.9) / (N - 1);
    const p = quad(A, C, B, t);
    const a = quadAngle(A, C, B, t);
    const L = (78 * Math.pow(1 - t, 0.75) + 5) * Math.min(1, (t + 0.12) / 0.3);
    for (const side of [-1, 1]) {
      const pa = a + side * 1.0;
      const e = along(p, pa, L);
      const c: Pt = [p[0] + Math.cos(pa) * L * 0.5 + Math.cos(a) * L * 0.14, p[1] + Math.sin(pa) * L * 0.5 + Math.sin(a) * L * 0.14];
      d += `M${pt(p)}Q${pt(c)} ${pt(e)}`;
      const n = Math.max(2, Math.round(L / 8));
      for (let k = 0; k < n; k++) {
        const u = (k + 0.6) / (n + 0.4);
        const q = quad(p, c, e, u);
        const b = quadAngle(p, c, e, u);
        const ll = L * 0.2 * (1 - u * 0.7) + 1.5;
        d += leaf(q, b - 0.85, ll, ll * 0.32) + leaf(q, b + 0.85, ll, ll * 0.32);
      }
    }
  }
  return d;
}

function flowerHead(c: Pt, r: number, petals: number, plen: number, rand: () => number) {
  let d = circle(c, r);
  for (let k = 0; k < Math.round(r * 0.9); k++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * r * 0.62;
    d += circle(along(c, a, rr), 0.9);
  }
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * Math.PI * 2 + (rand() - 0.5) * 0.12;
    d += leaf(along(c, a, r * 1.05), a, plen * (0.9 + rand() * 0.2), plen * 0.2);
  }
  return d;
}

// heřmánkové nitkovité lístky
function threadLeaf(p: Pt, ang: number, len: number) {
  let d = seg(p, along(p, ang, len));
  for (const v of [0.35, 0.6, 0.85]) {
    const m = along(p, ang, len * v);
    d += seg(m, along(m, ang - 0.6, len * 0.28)) + seg(m, along(m, ang + 0.6, len * 0.28));
  }
  return d;
}

function chamomile() {
  const rand = rng(7);
  let d = "M110 356C112 280 96 200 100 104";
  d += flowerHead([100, 90], 13, 17, 32, rand);
  d += "M104 252C122 222 150 196 157 160" + flowerHead([158, 148], 9, 14, 21, rand);
  d += "M101 204C90 188 72 178 60 166" + circle([56, 161], 5.5);
  for (const a of [0.9, 1.6, 2.3]) d += leaf(along([56, 161], a, 4), a, 7, 2.2);
  d += threadLeaf([108, 300], -0.6, 34) + threadLeaf([106, 280], -2.6, 30) + threadLeaf([102, 232], -2.4, 26) + threadLeaf([130, 216], -0.3, 22);
  return d;
}

function ear(A: Pt, C: Pt, B: Pt, grains: number) {
  let d = `M${pt(A)}Q${pt(C)} ${pt(B)}`;
  for (let k = 0; k < grains; k++) {
    const t = 0.56 + (k / grains) * 0.42;
    const p = quad(A, C, B, t);
    const a = quadAngle(A, C, B, t);
    for (const side of [-1, 1]) {
      const ga = a + side * 0.42;
      d += leaf(p, ga, 19, 5.5) + seg(along(p, ga, 19), along(along(p, ga, 19), a + side * 0.16, 26));
    }
  }
  const tip = B;
  const ta = quadAngle(A, C, B, 1);
  return d + leaf(tip, ta, 15, 4.5) + seg(along(tip, ta, 15), along(tip, ta, 40));
}

function wheat() {
  return (
    ear([62, 398], [58, 220], [70, 60], 9) +
    ear([60, 398], [44, 260], [26, 120], 7) +
    ear([64, 398], [80, 270], [104, 140], 7) +
    "M61 336C46 312 30 280 18 236C34 276 50 304 63 322M63 360C80 336 96 318 116 300C100 318 84 336 64 352"
  );
}

function hawthorn() {
  const rand = rng(11);
  let d = "M8 192C80 152 170 112 292 40M120 135C130 110 150 94 168 86M215 84C222 68 236 58 252 54";
  const spots: [Pt, number, number][] = [
    [[40, 174], -1.9, 46],
    [[70, 158], 0.1, 50],
    [[150, 96], -1.2, 40],
    [[185, 107], 0.35, 46],
    [[236, 58], -1.5, 34],
    [[262, 59], 0.5, 38],
  ];
  for (const [p, a, l] of spots) d += veinLeaf(p, a, l, l * 0.34);
  for (const c of [[170, 84], [294, 38], [104, 142]] as Pt[]) {
    for (let k = 0; k < 4; k++) {
      const a = -2.4 + k * 0.9 + rand() * 0.3;
      const b = along(c, a, 9 + rand() * 6);
      d += seg(c, b) + circle(along(b, a, 4.2), 4.2);
    }
  }
  return d;
}

function clover() {
  let d = "M86 316C90 250 78 170 84 100";
  const base: Pt = [84, 100];
  for (let a = -168; a <= -12; a += 13) d += leaf(along(base, (a * Math.PI) / 180, 4), (a * Math.PI) / 180, 30, 3.6);
  for (let a = -160; a <= -20; a += 14) d += leaf(along(base, (a * Math.PI) / 180, 2), (a * Math.PI) / 180, 20, 3);
  d += leaf(base, 2.3, 14, 4) + leaf(base, 0.8, 14, 4);
  const trefoil = (s: Pt, e: Pt, size: number) => {
    let r = `M${pt(s)}Q${f((s[0] + e[0]) / 2)} ${f(Math.min(s[1], e[1]) - 10)} ${pt(e)}`;
    for (const a of [-Math.PI / 2, -Math.PI / 2 - 1.05, -Math.PI / 2 + 1.05]) {
      r += leaf(e, a, size, size * 0.55);
      const m = along(e, a, size * 0.55);
      r += `M${pt(along(m, a - 2.4, size * 0.22))}L${pt(m)}L${pt(along(m, a + 2.4, size * 0.22))}`;
    }
    return r;
  };
  return d + trefoil([88, 236], [136, 196], 26) + trefoil([86, 276], [40, 250], 20);
}

function meadow() {
  const rand = rng(3);
  let d = "";
  for (let i = 0; i < 150; i++) {
    const x = i * 8 + rand() * 6;
    const h = 22 + rand() * 62;
    const lean = (rand() - 0.5) * 34;
    d += `M${f(x - 1.4)} 100Q${f(x + lean * 0.3)} ${f(100 - h * 0.6)} ${f(x + lean)} ${f(100 - h)}Q${f(x + lean * 0.3 + 2.4)} ${f(100 - h * 0.6)} ${f(x + 1.6)} 100`;
    if (i % 23 === 11) {
      const top: Pt = [x + lean * 0.4, 100 - h - 16];
      d += `M${f(x)} 100Q${f(x + lean * 0.2)} ${f(100 - h * 0.6)} ${pt(top)}` + flowerHead([top[0], top[1] - 2.6], 2.4, 9, 6, rand);
    }
  }
  return d;
}

function flourish() {
  return (
    "M4 12C30 9 50 15 76 12M124 12C150 9 170 15 196 12" +
    leaf([100, 12], Math.PI, 20, 5) +
    leaf([100, 12], 0, 20, 5) +
    leaf([100, 12], -Math.PI / 2, 9, 3.5) +
    leaf([100, 12], Math.PI / 2, 9, 3.5) +
    circle([83, 12], 1.4) +
    circle([117, 12], 1.4)
  );
}

const SPRIGS = {
  fern: { box: "0 0 200 420", d: fern },
  chamomile: { box: "0 0 220 360", d: chamomile },
  wheat: { box: "0 0 130 400", d: wheat },
  hawthorn: { box: "0 0 310 200", d: hawthorn },
  clover: { box: "0 0 170 320", d: clover },
  meadow: { box: "0 0 1200 100", d: meadow },
  flourish: { box: "0 0 200 24", d: flourish },
} as const;

export type SprigName = keyof typeof SPRIGS;

export function BotanicalSprite() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      {Object.entries(SPRIGS).map(([name, s]) => (
        <symbol key={name} id={`bot-${name}`} viewBox={s.box}>
          <path d={s.d()} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </symbol>
      ))}
    </svg>
  );
}

export function Sprig({ name, className = "", strokeWidth = 1, preserve }: { name: SprigName; className?: string; strokeWidth?: number; preserve?: string }) {
  return (
    <svg viewBox={SPRIGS[name].box} className={`pointer-events-none select-none ${className}`} strokeWidth={strokeWidth} preserveAspectRatio={preserve} aria-hidden="true" focusable="false">
      <use href={`#bot-${name}`} />
    </svg>
  );
}

export function Flourish({ className = "" }: { className?: string }) {
  return <Sprig name="flourish" className={`h-5 w-40 text-honey ${className}`} strokeWidth={1.2} />;
}

// letokruhy dřeva pro tmavé plochy (patička)
function woodGrain() {
  const rand = rng(5);
  const knots: Pt[] = [
    [230, 150],
    [640, 300],
    [980, 90],
  ];
  let d = "";
  for (let i = 0; i < 46; i++) {
    const y0 = i * 9 + rand() * 3;
    let line = "";
    for (let x = 0; x <= 1200; x += 12) {
      let y = y0 + 3.5 * Math.sin(x / 150 + i * 0.37) + 1.5 * Math.sin(x / 41 + i);
      for (const [kx, ky] of knots) {
        const dy = y0 - ky;
        if (Math.abs(dy) < 60) y += Math.sign(dy || 1) * (60 - Math.abs(dy)) * 0.55 * Math.exp(-(((x - kx) / 70) ** 2));
      }
      line += `${x === 0 ? "M" : "L"}${x} ${f(y)}`;
    }
    d += line;
  }
  for (const [kx, ky] of knots) {
    for (const r of [5, 10, 16]) d += `M${kx + r * 2.2} ${ky}a${r * 2.2} ${r} 0 1 0 ${-r * 4.4} 0a${r * 2.2} ${r} 0 1 0 ${r * 4.4} 0`;
  }
  return d;
}

export function WoodGrain({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 410" preserveAspectRatio="none" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" focusable="false">
      <path d={woodGrain()} fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
