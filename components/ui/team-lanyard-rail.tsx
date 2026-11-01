"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface LanyardLink {
  label: string;
  href: string;
}

export interface LanyardMember {
  id: string;
  name: string;
  role: string;
  team?: string;
  image: string;
  bio?: string;
  tags?: string[];
  links?: LanyardLink[];
  tone?: 1 | 2 | 3 | 4 | 5;
  drop?: number;
}

export interface TeamLanyardRailProps
  extends React.HTMLAttributes<HTMLElement> {
  items: LanyardMember[];
  eyebrow?: string;
  heading?: string;
  caption?: string;
  action?: React.ReactNode;
  autoplay?: boolean;
  interval?: number;
  active?: number | null;
  onActiveChange?: (index: number | null) => void;
  flipped?: number | null;
  onFlippedChange?: (index: number | null) => void;
  labels?: {
    flip?: string;
    back?: string;
    show?: string;
  };
  className?: string;
}

const CARD_ASPECT = 96 / 62;
const DESIGN_W = 124;
const MAX_W = 164;
const CAROUSEL_BREAKPOINT = 100;
const BASE_FONT = 11.2;
const MIN_SPACING = 1.16;
const MAX_SPACING = 1.62;
const CAROUSEL_SPACING = 1.2;
const EDGE_GAP = 0.07;
const PERSPECTIVE = 900;
const MAX_STRETCH = 64;
const AUTOPLAY_CYCLE = 1100;
const FLIP_DELAY = 700;
const SWING_K = 28;
const SWING_DAMP = 2.2;
const BETA_LAG = 0.12;
const REEL_K = 220;
const REEL_DAMP = 0.5;

const REST_BETA = [9, -10, 7, -8, 10, -7, 8, -9];
const REST_RZ = [-1.6, 1.2, -2, 1.5, -1, 1.8, -1.3, 2];
const DROPS = [6, 20, 0, 13, 22, 4, 16, 9];
const TONES = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
];

const DEFAULT_LABELS = {
  flip: "Click or press Enter to flip the badge",
  back: "Click again or press Esc to turn it back",
  show: "Show",
};

const METAL_SHINE =
  "linear-gradient(to right, color-mix(in oklab, var(--color-muted-foreground) 70%, black), color-mix(in oklab, var(--color-muted-foreground) 22%, white) 38%, var(--color-muted-foreground) 70%, color-mix(in oklab, var(--color-muted-foreground) 65%, black))";
const CLIP_SHADE =
  "linear-gradient(180deg, color-mix(in oklab, var(--color-muted-foreground) 30%, var(--color-background)), color-mix(in oklab, var(--color-muted-foreground) 72%, var(--color-background)))";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function qrSvgPath(seed: number) {
  const rng = random(seed);
  const corners = [
    [0, 0],
    [14, 0],
    [0, 14],
  ];
  let d = "";
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const corner = corners.find(
        ([cx = 0, cy = 0]) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7
      );
      const isFinder =
        (x < 8 && y < 8) || (x >= 13 && y < 8) || (x < 8 && y >= 13);
      let filled = false;
      if (corner) {
        filled =
          Math.max(
            Math.abs(x - (corner[0] ?? 0) - 3),
            Math.abs(y - (corner[1] ?? 0) - 3)
          ) !== 2;
      } else if (isFinder) {
        filled = false;
      } else if (x === 6 || y === 6) {
        filled = (x + y) % 2 === 0;
      } else {
        filled = rng() > 0.52;
      }
      if (filled) {
        d += `M${x} ${y}h1v1h-1z`;
      }
    }
  }
  return d;
}

function barcode(seed: number) {
  const rng = random(seed ^ 2654435769);
  let x = 0;
  let d = "";
  while (x < 92) {
    const w = 1 + Math.floor(rng() * 3);
    d += `M${x} 0h${w}v20h-${w}z`;
    x += w + 1 + Math.floor(rng() * 2.2);
  }
  return { d, width: x };
}

function soft(v: number, max: number) {
  const t = max * 0.75;
  if (v <= t) return v;
  return t + (max - t) * (1 - Math.exp(-(v - t) / (max - t)));
}

function geometry(cardW: number, items: LanyardMember[]) {
  const u = cardW / DESIGN_W;
  const H = cardW * CARD_ASPECT;
  const railR = Math.max(3, 4.2 * u);
  const railY = 14 + railR;
  const ring = 9 * u;
  const pivotY = railY + ring * 0.8;
  const strapW = Math.max(8, 11 * u);
  const crimp = 6 * u;
  const reel = 21 * u;
  const cordRest = 12 * u;
  const clipH = 13 * u;
  const clipW = 30 * u;
  const straps = items.map(
    (item, i) => 56 * u + Math.max(0, item.drop ?? DROPS[i % DROPS.length] ?? 0) * u
  );
  const reelTops = straps.map((s) => pivotY + s + crimp * 0.6);
  const clipTops = reelTops.map((r) => r + reel * 0.82 + cordRest);
  const cardTops = clipTops.map((c) => c + clipH * 0.62);
  const pendulum = cardTops.map((c) => c + H / 2 - pivotY);
  const basePendulum = pivotY + 56 * u + crimp * 0.6 + reel * 0.82 + cordRest + clipH * 0.62 + H / 2 - pivotY;
  const maxCardBottom = Math.max(0, ...cardTops.map((c) => c + H));

  return {
    W: cardW,
    H,
    u,
    railR,
    railY,
    ring,
    pivotY,
    strapW,
    crimp,
    reel,
    cordRest,
    clipH,
    clipW,
    straps,
    reelTops,
    clipTops,
    cardTops,
    pendulum,
    swingK: pendulum.map((p) => (SWING_K * basePendulum) / p),
    couple: pendulum.map((p) => (0.25 * 57.3) / p),
    maxStretch: Math.round(MAX_STRETCH * Math.min(1, cardW / 118)),
    height: Math.ceil(maxCardBottom + 16 * u + 8),
  };
}

function layoutTargets(
  width: number,
  cardW: number,
  isCarousel: boolean,
  focusIndex: number | null,
  count: number
) {
  if (!isCarousel) {
    const spacing = clamp(
      (width - 40 - cardW * 0.6) / Math.max(1, count),
      cardW * MIN_SPACING,
      cardW * MAX_SPACING
    );
    const startX = width / 2 - (spacing * (count - 1)) / 2;
    return {
      xs: Array.from({ length: count }, (_, i) => startX + i * spacing),
      total: 0,
    };
  }
  const itemW = cardW * CAROUSEL_SPACING;
  const totalW = itemW * count;
  const cyclic = count > 2 && totalW >= width + cardW * 2;
  const idx = focusIndex ?? 0;
  return {
    xs: Array.from({ length: count }, (_, i) => {
      let offset = i - idx;
      if (cyclic) {
        offset = ((offset % count) + count) % count;
        if (offset >= count / 2) offset -= count;
      }
      return width / 2 + offset * itemW;
    }),
    total: cyclic ? totalW : 0,
  };
}

function emptySim() {
  return {
    x: [] as number[],
    vx: [] as number[],
    px: [] as number[],
    tx: [] as number[],
    sw: [] as number[],
    vsw: [] as number[],
    beta: [] as number[],
    ry: [] as number[],
    vry: [] as number[],
    tr: [] as number[],
    rz: [] as number[],
    vrz: [] as number[],
    tz: [] as number[],
    lift: [] as number[],
    vlift: [] as number[],
    tl: [] as number[],
    pop: [] as number[],
    vpop: [] as number[],
    tp: [] as number[],
    st: [] as number[],
    vst: [] as number[],
    drag: -1,
    grab: 0,
    pull: -1,
    free: 0,
    last: 0,
    raf: 0,
    carousel: null as boolean | null,
  };
}

function spring(
  arr: number[],
  vArr: number[],
  target: number,
  index: number,
  stiffness: number,
  damping: number,
  dt: number
) {
  const v = vArr[index] ?? 0;
  const x = arr[index] ?? 0;
  const a = -stiffness * (x - target) - 2 * damping * Math.sqrt(stiffness) * v;
  vArr[index] = v + a * dt;
  arr[index] = x + vArr[index] * dt;
}

function badgeWidth(sim: ReturnType<typeof emptySim>, cardW: number, i: number) {
  return cardW * (1 + 0.08 * (sim.pop[i] ?? 0));
}

function minGap(sim: ReturnType<typeof emptySim>, cardW: number, a: number, b: number) {
  return (badgeWidth(sim, cardW, a) + badgeWidth(sim, cardW, b)) / 2 + cardW * EDGE_GAP;
}

function stops(sim: ReturnType<typeof emptySim>, cardW: number, width: number, count: number) {
  return [
    cardW * 0.32 + badgeWidth(sim, cardW, 0) / 2,
    width - cardW * 0.32 - badgeWidth(sim, cardW, count - 1) / 2,
  ];
}

function cardEdge(
  sim: ReturnType<typeof emptySim>,
  geo: ReturnType<typeof geometry>,
  index: number,
  side: number
) {
  const swingRad = ((sim.sw[index] ?? 0) * Math.PI) / 180;
  const rotZRad = (((sim.beta[index] ?? 0) + (sim.rz[index] ?? 0)) * Math.PI) / 180;
  const popScale = 1 + 0.08 * (sim.pop[index] ?? 0);
  const anchorY = (geo.clipTops[index] ?? 0) + (sim.st[index] ?? 0) - 4 * (sim.lift[index] ?? 0) - geo.pivotY;
  const cardRelY = (geo.cardTops[index] ?? 0) - (geo.clipTops[index] ?? 0);
  const baseX = (sim.x[index] ?? 0) - anchorY * Math.sin(swingRad);
  const halfW = (geo.W / 2) * popScale * Math.cos(rotZRad) * side;

  return [
    baseX + halfW - cardRelY * popScale * Math.sin(rotZRad),
    baseX + halfW - (cardRelY + geo.H) * popScale * Math.sin(rotZRad),
    anchorY + cardRelY * popScale,
    anchorY + (cardRelY + geo.H) * popScale,
  ];
}

function LinkIcon({ label }: { label: string }) {
  if (/mail|@/i.test(label)) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-[1.05em] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <rect x="2" y="3.5" width="12" height="9" rx="1.6" />
        <path d="M2.6 4.6 8 8.9l5.4-4.3" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-[1.05em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 11 11 5M6.2 5H11v4.8" />
    </svg>
  );
}

const LINK_CLS =
  "inline-flex items-center gap-[0.3em] rounded-[0.4em] px-[0.3em] py-[0.14em] text-[0.68em] font-medium leading-tight";

function Band({ tone, tall }: { tone: string; tall?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-0 top-0 block ${tone} ${
        tall ? "h-[4.3em]" : "h-[2.15em]"
      }`}
      style={{
        background:
          "repeating-linear-gradient(135deg, transparent 0 0.45em, color-mix(in oklab, white 10%, transparent) 0.45em 0.56em), linear-gradient(180deg, color-mix(in oklab, currentColor 80%, white), currentColor 72%, color-mix(in oklab, currentColor 86%, black))",
      }}
    >
      <span className="absolute inset-x-0 bottom-0 h-px bg-black/15" />
    </span>
  );
}

function Hole() {
  return (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-[0.72em] block h-[0.56em] w-[2.7em] -translate-x-1/2 rounded-full bg-background"
      style={{
        boxShadow:
          "inset 0 0.09em 0.2em color-mix(in oklab, black 55%, transparent), 0 0.05em 0 color-mix(in oklab, white 30%, transparent)",
      }}
    />
  );
}

function Finish() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 block w-[200%] opacity-70 dark:opacity-35"
        style={{
          background:
            "linear-gradient(100deg, transparent 40%, color-mix(in oklab, white 26%, transparent) 48%, color-mix(in oklab, white 8%, transparent) 52%, transparent 58%)",
          transform: "translateX(var(--gx, 0%))",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block bg-black"
        style={{ opacity: "var(--shade, 0)" }}
      />
    </>
  );
}

function Silhouette() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="size-full text-muted-foreground/60"
    >
      <circle cx="20" cy="15" r="7" fill="currentColor" />
      <path d="M6 38c1.5-8 7-12 14-12s12.5 4 14 12z" fill="currentColor" />
    </svg>
  );
}

const BadgeFaces = memo(function BadgeFaces({
  item,
  tone,
}: {
  item: LanyardMember;
  tone: string;
}) {
  const seed = useMemo(
    () => hash(`${item.id}:${item.name}`),
    [item.id, item.name]
  );
  const qrD = useMemo(() => qrSvgPath(seed), [seed]);
  const barData = useMemo(() => barcode(seed), [seed]);
  const serial = String(seed % 1000000000).padStart(9, "0");
  const [imgError, setImgError] = useState(false);
  const tags = (item.tags ?? []).slice(0, 3);
  const links = (item.links ?? []).slice(0, 3);

  return (
    <>
      {/* Front Face */}
      <span
        data-face="front"
        className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-[0.85em] border border-border bg-card px-[0.8em] pb-[0.7em] text-card-foreground [backface-visibility:hidden]"
        style={{ transform: "translateZ(1px)" }}
      >
        <Band tone={tone} tall />
        <Hole />
        <span
          className="relative mt-[2.05em] block size-[5.3em] shrink-0 rounded-full bg-card p-[0.2em]"
          style={{
            boxShadow:
              "0 0.15em 0.5em color-mix(in oklab, var(--color-foreground) 22%, transparent)",
          }}
        >
          <span className="relative block size-full overflow-hidden rounded-full bg-muted">
            <Silhouette />
            {!imgError && (
              <img
                src={item.image}
                alt=""
                draggable={false}
                decoding="async"
                onError={() => setImgError(true)}
                className="pointer-events-none absolute inset-0 block size-full select-none object-cover"
              />
            )}
          </span>
        </span>
        <span className="mt-[0.55em] block w-full truncate text-center text-[1.08em] font-semibold leading-tight tracking-tight">
          {item.name}
        </span>
        <span className="mt-[0.15em] block w-full truncate text-center text-[0.8em] leading-snug text-muted-foreground">
          {item.role}
        </span>
        {item.team && (
          <span className="mt-[0.5em] block w-full truncate text-center text-[0.6em] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {item.team}
          </span>
        )}
        <span className="mt-auto block w-full border-t border-dashed border-border pt-[0.5em]">
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${barData.width} 20`}
            preserveAspectRatio="none"
            className="block h-[1.6em] w-full text-foreground/80"
          >
            <path d={barData.d} fill="currentColor" />
          </svg>
          <span className="mt-[0.25em] block text-center font-mono text-[0.52em] tracking-[0.32em] text-muted-foreground">
            {serial}
          </span>
        </span>
        <Finish />
      </span>

      {/* Back Face */}
      <span
        data-face="back"
        className="absolute inset-0 overflow-hidden rounded-[0.85em] border border-border bg-card text-card-foreground [backface-visibility:hidden]"
        style={{ transform: "rotateY(180deg) translateZ(1px)" }}
      >
        <Band tone={tone} />
        <Hole />
        <span className="absolute inset-x-[0.85em] top-[2.6em] block">
          <span className="block truncate text-[0.95em] font-semibold leading-tight">
            {item.name}
          </span>
          <span className="block truncate text-[0.72em] leading-snug text-muted-foreground">
            {item.role}
          </span>
        </span>
        {item.bio && (
          <span className="absolute inset-x-[0.85em] top-[5.1em] block">
            <span data-bio className="line-clamp-3 max-h-[4.3em] overflow-hidden text-[0.74em] leading-[1.4]">
              {item.bio}
            </span>
          </span>
        )}
        {tags.length > 0 && (
          <span className="absolute inset-x-[0.85em] top-[9.8em] flex flex-wrap gap-[0.28em]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="block rounded-full border border-border bg-muted/60 px-[0.6em] py-[0.16em] text-[0.6em] leading-tight text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
        {links.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute bottom-[0.75em] left-[0.6em] flex flex-col items-start gap-[0.1em] transition-opacity duration-150 motion-reduce:transition-none"
            style={{ opacity: "var(--drawn, 1)" }}
          >
            {links.map((link) => (
              <span key={link.label} className={LINK_CLS}>
                <LinkIcon label={link.label} />
                {link.label}
              </span>
            ))}
          </span>
        )}
        <svg
          aria-hidden="true"
          viewBox="-1 -1 23 23"
          className="absolute bottom-[0.8em] right-[0.8em] size-[3.9em] text-foreground"
        >
          <path d={qrD} fill="currentColor" />
        </svg>
        <Finish />
      </span>

      {/* Card edge depth */}
      {[0, 1].map((side) => (
        <span
          key={side}
          aria-hidden="true"
          className="absolute inset-y-[0.85em] block w-[2px]"
          style={{
            [side ? "right" : "left"]: 0,
            transform: `translateX(${side ? 1 : -1}px) rotateY(90deg)`,
            background:
              "color-mix(in oklab, var(--color-foreground) 30%, var(--color-card))",
          }}
        />
      ))}
    </>
  );
});

export default function TeamLanyardRail({
  items = [],
  eyebrow,
  heading,
  caption,
  action,
  autoplay = false,
  interval = 2800,
  active,
  onActiveChange,
  flipped,
  onFlippedChange,
  labels = DEFAULT_LABELS,
  className,
  ...rest
}: TeamLanyardRailProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const count = items.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const lanyardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const swingRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const strapRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hangRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const badgeBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const linksRefs = useRef<(HTMLDivElement | null)[]>([]);

  const simRef = useRef(emptySim());
  const [size, setSize] = useState({ width: 0, W: MAX_W, carousel: false });
  const [localActive, setLocalActive] = useState<number | null>(null);
  const [localFlipped, setLocalFlipped] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoRunning, setAutoRunning] = useState(autoplay);
  const pendingClick = useRef(-1);

  const pointerState = useRef({
    id: -1,
    index: -1,
    x: 0,
    y: 0,
    mode: "",
    kind: "",
    lastX: 0,
    lastY: 0,
    lastT: 0,
    v: 0,
    swipe: 0,
    angle: 0,
    hoverX: 0,
    hoverT: 0,
    hoverHit: -1,
  });

  const valid = (i: number | null | undefined) =>
    i == null || i < 0 || i >= count ? null : i;
  const currentActive = valid(active !== undefined ? active : localActive);
  const currentFlipped = valid(flipped !== undefined ? flipped : localFlipped);
  const geo = useMemo(() => geometry(size.W, items), [size.W, items]);

  const stateRef = useRef({
    active: currentActive,
    flipped: currentFlipped,
    size,
    geo,
    reduced: reducedMotion,
    count,
    carouselIndex: 0,
    cyclic: false,
    activeControlled: false,
    flippedControlled: false,
  });
  stateRef.current = {
    ...stateRef.current,
    active: currentActive,
    flipped: currentFlipped,
    size,
    geo,
    reduced: reducedMotion,
    count,
    activeControlled: active !== undefined,
    flippedControlled: flipped !== undefined,
  };

  const handlersRef = useRef({ onActiveChange, onFlippedChange });
  handlersRef.current = { onActiveChange, onFlippedChange };

  const setActive = useCallback((idx: number | null) => {
    const s = stateRef.current;
    if (s.active !== idx) {
      s.active = idx;
      if (idx !== null) s.carouselIndex = idx;
      if (!s.activeControlled) setLocalActive(idx);
      handlersRef.current.onActiveChange?.(idx);
    }
  }, []);

  const setFlipped = useCallback((idx: number | null) => {
    const s = stateRef.current;
    if (s.flipped === idx) return;
    const oldFlipped = s.flipped;
    if (
      oldFlipped !== null &&
      linksRefs.current[oldFlipped]?.contains(document.activeElement)
    ) {
      badgeBtnRefs.current[oldFlipped]?.focus({ preventScroll: true });
    }
    s.flipped = idx;
    if (!s.flippedControlled) setLocalFlipped(idx);
    handlersRef.current.onFlippedChange?.(idx);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setAutoRunning(autoplay);
  }, [autoplay]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = (w: number) => {
      const c = Math.max(1, stateRef.current.count);
      const est = Math.min(MAX_W, (w - 40) / (c * MIN_SPACING + 0.4));
      const isCar = est < CAROUSEL_BREAKPOINT;
      const widthSnapped =
        Math.round((isCar ? clamp(w * 0.3, 96, 118) : est) * 4) / 4;
      setSize((prev) =>
        Math.abs(prev.width - w) < 0.5 &&
        prev.carousel === isCar &&
        prev.W === widthSnapped
          ? prev
          : { width: w, W: widthSnapped, carousel: isCar }
      );
    };
    measure(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) measure(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  const paint = useCallback((i: number) => {
    const sim = simRef.current;
    const g = stateRef.current.geo;
    const lanyardEl = lanyardRefs.current[i];
    if (!lanyardEl) return;

    lanyardEl.style.transform = `translate3d(${((sim.x[i] ?? 0) - g.W / 2).toFixed(2)}px,0,0)`;
    const swVal = sim.sw[i] ?? 0;
    const swingEl = swingRefs.current[i];
    if (swingEl) swingEl.style.transform = `rotate(${swVal.toFixed(3)}deg)`;

    const stretch = sim.st[i] ?? 0;
    strapRefs.current[i]?.style.setProperty("--stretch", `${stretch.toFixed(2)}px`);
    const cordEl = cordRefs.current[i];
    if (cordEl)
      cordEl.style.transform = `scaleY(${Math.max(
        0.12,
        (g.cordRest + stretch) / g.cordRest
      ).toFixed(4)})`;

    const lift = sim.lift[i] ?? 0;
    const pop = sim.pop[i] ?? 0;
    const hangEl = hangRefs.current[i];
    if (hangEl)
      hangEl.style.transform = `translate3d(0,${(stretch - 4 * lift).toFixed(
        2
      )}px,0) rotate(${((sim.beta[i] ?? 0) - swVal + (sim.rz[i] ?? 0)).toFixed(
        3
      )}deg) scale(${(1 + 0.08 * pop).toFixed(4)})`;

    const ryVal = sim.ry[i] ?? 0;
    const flipEl = flipRefs.current[i];
    const cosY = Math.abs(Math.cos((ryVal * Math.PI) / 180));
    if (flipEl) {
      flipEl.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${ryVal.toFixed(2)}deg)`;
      flipEl.style.setProperty("--shade", ((1 - cosY) * 0.45).toFixed(3));
      const glint = ((((ryVal + 90) % 180) + 180) % 180) - 90;
      flipEl.style.setProperty("--gx", `${(glint * 0.9).toFixed(1)}%`);
    }

    const shadowEl = shadowRefs.current[i];
    if (shadowEl) {
      shadowEl.style.transform = `translate3d(${(g.W * 0.045 + lift * 3 * g.u).toFixed(
        2
      )}px,${(g.H * 0.03 + lift * 7 * g.u).toFixed(2)}px,0) scale(${(
        Math.max(0.12, cosY) *
        (1 + 0.03 * lift + 0.05 * pop)
      ).toFixed(3)},${(1 + 0.03 * lift + 0.05 * pop).toFixed(3)})`;
      shadowEl.style.opacity = (0.72 + 0.28 * lift).toFixed(3);
    }

    const linksEl = linksRefs.current[i];
    const showLinks =
      !!linksEl &&
      Math.abs(ryVal - 180) < (linksEl.style.visibility === "visible" ? 24 : 9);
    if (linksEl) {
      linksEl.style.opacity = showLinks ? "1" : "0";
      linksEl.style.visibility = showLinks ? "visible" : "hidden";
    }
    flipEl?.style.setProperty("--drawn", showLinks ? "0" : "1");
  }, []);

  const step = useCallback(
    (now: number) => {
      const sim = simRef.current;
      const s = stateRef.current;
      const c = s.count;
      const g = s.geo;
      const { width: w, carousel: isCar } = s.size;
      const delta = sim.last ? Math.min(0.1, (now - sim.last) / 1000) : 1 / 60;
      sim.last = now;

      const subSteps = Math.max(3, Math.ceil(delta / 0.006));
      const subDt = delta / subSteps;
      let activeEnergy = false;

      for (let sub = 0; sub < subSteps; sub++) {
        for (let i = 0; i < c; i++) {
          const vx = sim.vx[i] ?? 0;
          if (i !== sim.drag) {
            const acc =
              now > sim.free
                ? -130 * ((sim.x[i] ?? 0) - (sim.tx[i] ?? 0)) -
                  2 * Math.sqrt(130) * 0.86 * vx
                : -3.2 * vx;
            sim.vx[i] = vx + acc * subDt;
            sim.x[i] = (sim.x[i] ?? 0) + sim.vx[i] * subDt;
          }
        }

        if (!isCar && c > 0) {
          const [leftStop, rightStop] = stops(sim, g.W, w, c);
          if (sim.drag >= 0) {
            const d = sim.drag;
            for (let i = d - 1; i >= 0; i--) {
              const maxAllowed =
                (sim.x[i + 1] ?? 0) - minGap(sim, g.W, i, i + 1);
              if ((sim.x[i] ?? 0) > maxAllowed) {
                sim.x[i] = maxAllowed;
                sim.vx[i] = Math.min(sim.vx[i] ?? 0, sim.vx[i + 1] ?? 0);
              }
            }
            for (let i = d + 1; i < c; i++) {
              const minAllowed =
                (sim.x[i - 1] ?? 0) + minGap(sim, g.W, i - 1, i);
              if ((sim.x[i] ?? 0) < minAllowed) {
                sim.x[i] = minAllowed;
                sim.vx[i] = Math.max(sim.vx[i] ?? 0, sim.vx[i - 1] ?? 0);
              }
            }
          } else {
            for (let iter = 0; iter < 3; iter++) {
              for (let i = 0; i < c - 1; i++) {
                const xi = sim.x[i] ?? 0;
                const xj = sim.x[i + 1] ?? 0;
                const overlap = minGap(sim, g.W, i, i + 1) - (xj - xi);
                if (overlap <= 0) continue;
                sim.x[i] = xi - overlap / 2;
                sim.x[i + 1] = xj + overlap / 2;
                const v1 = sim.vx[i] ?? 0;
                const v2 = sim.vx[i + 1] ?? 0;
                if (v1 > v2) {
                  const avgV = (v1 + v2) / 2;
                  sim.vx[i] = avgV;
                  sim.vx[i + 1] = avgV;
                }
              }
            }
            if ((sim.x[0] ?? 0) < leftStop) {
              sim.x[0] = leftStop;
              sim.vx[0] = Math.abs(sim.vx[0] ?? 0) * 0.3;
            }
            for (let i = 1; i < c; i++) {
              sim.x[i] = Math.max(
                sim.x[i] ?? 0,
                (sim.x[i - 1] ?? 0) + minGap(sim, g.W, i - 1, i)
              );
            }
            if ((sim.x[c - 1] ?? 0) > rightStop) {
              sim.x[c - 1] = rightStop;
              sim.vx[c - 1] = -Math.abs(sim.vx[c - 1] ?? 0) * 0.3;
            }
            for (let i = c - 2; i >= 0; i--) {
              sim.x[i] = Math.min(
                sim.x[i] ?? 0,
                (sim.x[i + 1] ?? 0) - minGap(sim, g.W, i, i + 1)
              );
            }
          }
        }

        for (let i = 0; i < c; i++) {
          const deltaVx = (sim.vx[i] ?? 0) - (sim.px[i] ?? 0);
          sim.px[i] = sim.vx[i] ?? 0;
          if (i !== sim.pull) {
            const sw = sim.sw[i] ?? 0;
            const coupledV = clamp(
              (sim.vsw[i] ?? 0) +
                (g.couple[i] ?? 0.07) * clamp(deltaVx, -900, 900),
              -90,
              90
            );
            const swAcc =
              coupledV + (-(g.swingK[i] ?? SWING_K) * sw - SWING_DAMP * coupledV) * subDt;
            sim.vsw[i] = swAcc;
            sim.sw[i] = clamp(sw + swAcc * subDt, -18, 18);
          }
          sim.beta[i] =
            (sim.beta[i] ?? 0) +
            ((sim.sw[i] ?? 0) - (sim.beta[i] ?? 0)) * Math.min(1, subDt / BETA_LAG);

          spring(sim.ry, sim.vry, sim.tr[i] ?? 0, i, 170, 0.62, subDt);
          spring(sim.rz, sim.vrz, sim.tz[i] ?? 0, i, 120, 0.8, subDt);
          spring(sim.lift, sim.vlift, sim.tl[i] ?? 0, i, 200, 0.75, subDt);
          spring(sim.pop, sim.vpop, sim.tp[i] ?? 0, i, 160, 0.55, subDt);

          if (i !== sim.pull) {
            spring(sim.st, sim.vst, 0, i, REEL_K, REEL_DAMP, subDt);
            sim.st[i] = Math.max(-g.cordRest * 0.85, sim.st[i] ?? 0);
          }
        }

        for (let i = 0; i < c - 1; i++) {
          const j = i + 1;
          if ((sim.x[j] ?? 0) <= (sim.x[i] ?? 0)) continue;
          const [top1, bot1, yTop1, yBot1] = cardEdge(sim, g, i, 1);
          const [top2, bot2, yTop2, yBot2] = cardEdge(sim, g, j, -1);
          const topOverlap = top1 - top2 + 2;
          const botOverlap = bot1 - bot2 + 2;
          const overlap = Math.max(topOverlap, botOverlap);
          if (overlap <= 0) continue;

          const lever = Math.max(
            40,
            topOverlap > botOverlap ? (yTop1 + yTop2) / 2 : (yBot1 + yBot2) / 2
          );
          const angularImpulse =
            (Math.asin(clamp(overlap / lever, 0, 1)) * 180) / Math.PI;
          const ratio = i === sim.pull ? 0 : j === sim.pull ? 1 : 0.5;

          sim.sw[i] = clamp((sim.sw[i] ?? 0) + angularImpulse * ratio, -18, 18);
          sim.beta[i] = (sim.beta[i] ?? 0) + angularImpulse * ratio;
          sim.sw[j] = clamp(
            (sim.sw[j] ?? 0) - angularImpulse * (1 - ratio),
            -18,
            18
          );
          sim.beta[j] = (sim.beta[j] ?? 0) - angularImpulse * (1 - ratio);

          const vsw1 = sim.vsw[i] ?? 0;
          const vsw2 = sim.vsw[j] ?? 0;
          if (vsw2 - vsw1 > 0) {
            const avg = (vsw1 + vsw2) / 2;
            if (i !== sim.pull) sim.vsw[i] = avg + (vsw2 - vsw1) * 0.15;
            if (j !== sim.pull) sim.vsw[j] = avg - (vsw2 - vsw1) * 0.15;
          }
        }
      }

      for (let i = 0; i < c; i++) {
        paint(i);
        if (
          Math.abs(sim.vx[i] ?? 0) > 0.4 ||
          (now > sim.free &&
            Math.abs((sim.x[i] ?? 0) - (sim.tx[i] ?? 0)) > 0.25) ||
          Math.abs((sim.ry[i] ?? 0) - (sim.tr[i] ?? 0)) > 0.05 ||
          Math.abs(sim.vry[i] ?? 0) > 0.05 ||
          Math.abs((sim.rz[i] ?? 0) - (sim.tz[i] ?? 0)) > 0.02 ||
          Math.abs(sim.vrz[i] ?? 0) > 0.05 ||
          Math.abs((sim.lift[i] ?? 0) - (sim.tl[i] ?? 0)) > 0.002 ||
          Math.abs(sim.vlift[i] ?? 0) > 0.01 ||
          Math.abs((sim.pop[i] ?? 0) - (sim.tp[i] ?? 0)) > 0.002 ||
          Math.abs(sim.vpop[i] ?? 0) > 0.01 ||
          Math.abs(sim.sw[i] ?? 0) > 0.02 ||
          Math.abs(sim.vsw[i] ?? 0) > 0.05 ||
          Math.abs((sim.beta[i] ?? 0) - (sim.sw[i] ?? 0)) > 0.01 ||
          Math.abs(sim.st[i] ?? 0) > 0.05 ||
          Math.abs(sim.vst[i] ?? 0) > 0.1
        ) {
          activeEnergy = true;
        }
      }

      if (sim.drag >= 0 || sim.pull >= 0 || now < sim.free) {
        activeEnergy = true;
      }

      if (activeEnergy) {
        sim.raf = requestAnimationFrame(step);
      } else {
        sim.raf = 0;
        sim.last = 0;
        for (let i = 0; i < c; i++) {
          if (now > sim.free) {
            sim.x[i] = sim.tx[i] ?? 0;
            sim.vx[i] = 0;
            sim.px[i] = 0;
          }
          sim.sw[i] = 0;
          sim.vsw[i] = 0;
          sim.beta[i] = 0;
          sim.st[i] = 0;
          sim.vst[i] = 0;
          sim.ry[i] = sim.tr[i] ?? 0;
          sim.vry[i] = 0;
          sim.rz[i] = sim.tz[i] ?? 0;
          sim.vrz[i] = 0;
          sim.lift[i] = sim.tl[i] ?? 0;
          sim.vlift[i] = 0;
          sim.pop[i] = sim.tp[i] ?? 0;
          sim.vpop[i] = 0;
          paint(i);
        }
      }
    },
    [paint]
  );

  const resetAll = useCallback(() => {
    const sim = simRef.current;
    for (let i = 0; i < stateRef.current.count; i++) {
      sim.x[i] = sim.tx[i] ?? 0;
      sim.vx[i] = 0;
      sim.px[i] = 0;
      sim.sw[i] = 0;
      sim.vsw[i] = 0;
      sim.beta[i] = 0;
      if (i !== sim.pull) {
        sim.st[i] = 0;
        sim.vst[i] = 0;
      }
      sim.ry[i] = sim.tr[i] ?? 0;
      sim.vry[i] = 0;
      sim.rz[i] = sim.tz[i] ?? 0;
      sim.vrz[i] = 0;
      sim.lift[i] = sim.tl[i] ?? 0;
      sim.vlift[i] = 0;
      sim.pop[i] = sim.tp[i] ?? 0;
      sim.vpop[i] = 0;
      paint(i);
    }
  }, [paint]);

  const wake = useCallback(() => {
    const sim = simRef.current;
    if (stateRef.current.reduced) {
      cancelAnimationFrame(sim.raf);
      sim.raf = 0;
      resetAll();
      return;
    }
    if (!sim.raf) {
      sim.last = 0;
      sim.raf = requestAnimationFrame(step);
    }
  }, [resetAll, step]);

  const impulseSwing = useCallback(
    (idx: number, impulse: number) => {
      const sim = simRef.current;
      if (stateRef.current.reduced || idx < 0 || idx >= stateRef.current.count)
        return;
      sim.vsw[idx] = (sim.vsw[idx] ?? 0) + impulse;
      wake();
    },
    [wake]
  );

  const impulseReel = useCallback(
    (idx: number, impulse: number) => {
      const sim = simRef.current;
      if (stateRef.current.reduced || idx < 0 || idx >= stateRef.current.count)
        return;
      sim.vst[idx] = (sim.vst[idx] ?? 0) + impulse;
      wake();
    },
    [wake]
  );

  useLayoutEffect(() => {
    if (!size.width) return;
    const sim = simRef.current;
    const s = stateRef.current;
    const focus = size.carousel ? currentActive ?? s.carouselIndex : null;
    const { xs, total } = layoutTargets(size.width, size.W, size.carousel, focus, count);
    s.cyclic = total > 0;
    const changed = sim.x.length !== count || sim.carousel !== size.carousel;
    sim.carousel = size.carousel;

    for (let i = 0; i < count; i++) {
      const targetX = (xs[i] ?? 0) + (size.carousel ? pointerState.current.swipe : 0);
      if (!changed && total > 0) {
        const wrapOffset = Math.round((targetX - (sim.tx[i] ?? targetX)) / total) * total;
        if (wrapOffset) sim.x[i] = (sim.x[i] ?? 0) + wrapOffset;
      }
      sim.tx[i] = targetX;
      const isFocused = currentFlipped === i || currentActive === i;
      sim.tr[i] =
        currentFlipped === i
          ? 180
          : currentActive === i
          ? 0
          : REST_BETA[i % REST_BETA.length] ?? 0;
      sim.tz[i] = isFocused ? 0 : REST_RZ[i % REST_RZ.length] ?? 0;
      sim.tl[i] = isFocused ? 1 : 0;
      sim.tp[i] = currentFlipped === i ? 1 : 0;

      if (changed) {
        sim.x[i] = targetX;
        sim.vx[i] = 0;
        sim.px[i] = 0;
        sim.sw[i] = 0;
        sim.vsw[i] = 0;
        sim.beta[i] = 0;
        sim.st[i] = 0;
        sim.vst[i] = 0;
        sim.ry[i] = sim.tr[i] ?? 0;
        sim.vry[i] = 0;
        sim.rz[i] = sim.tz[i] ?? 0;
        sim.vrz[i] = 0;
        sim.lift[i] = sim.tl[i] ?? 0;
        sim.vlift[i] = 0;
        sim.pop[i] = sim.tp[i] ?? 0;
        sim.vpop[i] = 0;
      }
    }

    const fields: (keyof typeof sim)[] = [
      "x", "vx", "px", "tx", "sw", "vsw", "beta", "ry", "vry", "tr",
      "rz", "vrz", "tz", "lift", "vlift", "tl", "pop", "vpop", "tp", "st", "vst"
    ];
    for (const f of fields) {
      (sim[f] as number[]).length = count;
    }
    if (changed) {
      for (let i = 0; i < count; i++) paint(i);
    }
    wake();
  }, [size, currentActive, currentFlipped, count, paint, wake]);

  useEffect(() => {
    if (reducedMotion) wake();
  }, [reducedMotion, wake]);

  const introDone = useRef(false);
  const measured = size.width > 0;
  useEffect(() => {
    if (!measured || reducedMotion || introDone.current) return;
    const timers = Array.from({ length: count }, (_, i) =>
      window.setTimeout(
        () => impulseSwing(i, (i % 2 ? -1 : 1) * (30 - (i % 4) * 3)),
        60 + i * 70
      )
    );
    const endTimer = window.setTimeout(() => {
      introDone.current = true;
    }, 80 + count * 70);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(endTimer);
    };
  }, [measured, reducedMotion, count, impulseSwing]);

  useEffect(
    () => () => {
      cancelAnimationFrame(simRef.current.raf);
      simRef.current.raf = 0;
    },
    []
  );

  const prevActiveFlipped = useRef({ active: null as number | null, flipped: null as number | null });
  useEffect(() => {
    const p = prevActiveFlipped.current;
    const wrap = (i: number) =>
      stateRef.current.cyclic ? ((i % count) + count) % count : i;

    if (p.active !== currentActive) {
      if (currentActive !== null) {
        impulseSwing(wrap(currentActive - 1), 16);
        impulseSwing(wrap(currentActive + 1), -16);
      }
      if (p.active !== null) {
        impulseSwing(wrap(p.active - 1), -6);
        impulseSwing(wrap(p.active + 1), 6);
      }
    }
    if (p.flipped !== currentFlipped) {
      if (currentFlipped !== null) {
        impulseSwing(currentFlipped, currentFlipped % 2 ? 9 : -9);
        impulseReel(currentFlipped, 70);
      }
      if (p.flipped !== null) {
        impulseReel(p.flipped, 40);
      }
    }
    prevActiveFlipped.current = { active: currentActive, flipped: currentFlipped };
  }, [currentActive, currentFlipped, count, impulseSwing, impulseReel]);

  const stopAutoplay = useCallback(() => setAutoRunning(false), []);

  useEffect(() => {
    if (!autoRunning || reducedMotion || count === 0 || !measured) return;
    let timerId = 0;

    function goFront(idx: number) {
      setActive(idx);
      timerId = window.setTimeout(() => goFlip(idx), FLIP_DELAY);
    }
    function goFlip(idx: number) {
      setFlipped(idx);
      timerId = window.setTimeout(() => {
        setFlipped(null);
        goFront((idx + 1) % Math.max(1, stateRef.current.count));
      }, interval);
    }

    const cur = stateRef.current.active;
    timerId =
      cur === null
        ? window.setTimeout(() => goFront(0), AUTOPLAY_CYCLE)
        : window.setTimeout(() => goFlip(cur), FLIP_DELAY);

    return () => window.clearTimeout(timerId);
  }, [autoRunning, reducedMotion, count, measured, interval, setActive, setFlipped]);

  useEffect(() => {
    if (currentFlipped === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const el = stageRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) {
        setFlipped(null);
      } else {
        setFlipped(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentFlipped, setFlipped]);

  const toggleFlip = useCallback(
    (idx: number) => {
      stopAutoplay();
      const next = stateRef.current.flipped === idx ? null : idx;
      if (next !== null) setActive(idx);
      setFlipped(next);
    },
    [stopAutoplay, setActive, setFlipped]
  );

  const retarget = () => {
    const sim = simRef.current;
    const s = stateRef.current;
    const { xs } = layoutTargets(
      s.size.width,
      s.size.W,
      s.size.carousel,
      s.size.carousel ? s.active ?? s.carouselIndex : null,
      s.count
    );
    for (let i = 0; i < s.count; i++) {
      sim.tx[i] = (xs[i] ?? 0) + (s.size.carousel ? pointerState.current.swipe : 0);
    }
    if (s.reduced) resetAll();
    else wake();
  };

  const feasible = (idx: number) => {
    const sim = simRef.current;
    const s = stateRef.current;
    const w = s.geo.W;
    const c = s.count;
    let [minX, maxX] = stops(sim, w, s.size.width, c);
    for (let i = 0; i < idx; i++) minX += minGap(sim, w, i, i + 1);
    for (let i = c - 1; i > idx; i--) maxX -= minGap(sim, w, i - 1, i);
    return [minX, Math.max(minX, maxX)];
  };

  const nearest = (cx: number, cy: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const relX = cx - rect.left;
    const relY = cy - rect.top;
    const g = stateRef.current.geo;
    const sim = simRef.current;
    if (relY < g.railY - 12) return null;

    let closest: number | null = null;
    let minDist = Infinity;
    for (let i = 0; i < stateRef.current.count; i++) {
      if (relY > (g.cardTops[i] ?? 0) + g.H + Math.max(0, sim.st[i] ?? 0) + 8)
        continue;
      const dist = Math.abs(relX - (sim.x[i] ?? 0));
      if (dist < g.W / 2 + 6 && dist < minDist) {
        closest = i;
        minDist = dist;
      }
    }
    return closest;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointerState.current;
    const sim = simRef.current;
    const s = stateRef.current;
    const stage = stageRef.current;
    const now = performance.now();

    if (p.id === e.pointerId && stage) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (!p.mode && Math.hypot(dx, dy) > 8) {
        if (Math.abs(dy) > Math.abs(dx)) {
          p.mode = dy > 0 && p.index >= 0 ? "pull" : "none";
        } else {
          p.mode = s.size.carousel
            ? "swipe"
            : p.index >= 0 && !s.reduced
            ? "drag"
            : "none";
        }
        if (p.mode !== "none") {
          stopAutoplay();
          if (stage.isConnected) stage.setPointerCapture(e.pointerId);
        }
        if (p.mode === "pull") sim.pull = p.index;
        if (p.mode === "drag") {
          sim.drag = p.index;
          sim.grab =
            e.clientX -
            stage.getBoundingClientRect().left -
            (sim.x[p.index] ?? 0);
        }
      }

      const dt = Math.max(1, now - p.lastT);
      p.v = p.v * 0.6 + (((e.clientX - p.lastX) / dt) * 0.4);
      p.lastX = e.clientX;
      p.lastY = e.clientY;
      p.lastT = now;

      if (p.mode === "pull") {
        const idx = p.index;
        sim.st[idx] = soft(Math.max(0, dy), s.geo.maxStretch);
        sim.vst[idx] = 0;
        const targetSw = clamp(
          (-Math.atan2(
            dx,
            (s.geo.pendulum[idx] ?? 200) + (sim.st[idx] ?? 0)
          ) *
            180) /
            Math.PI,
          -16,
          16
        );
        sim.vsw[idx] = ((targetSw - (sim.sw[idx] ?? 0)) / dt) * 1000 * 0.5;
        sim.sw[idx] = targetSw;
        if (s.reduced) paint(idx);
        else wake();
      } else if (p.mode === "drag" && sim.drag >= 0) {
        const [minX, maxX] = feasible(sim.drag);
        sim.x[sim.drag] = clamp(
          e.clientX - stage.getBoundingClientRect().left - sim.grab,
          minX,
          maxX
        );
        sim.vx[sim.drag] = p.v * 1000;
        sim.free = now + 900;
        wake();
      } else if (p.mode === "swipe") {
        p.swipe = dx;
        retarget();
      }
      return;
    }

    if (e.pointerType !== "mouse" || p.id >= 0) return;
    const hit = nearest(e.clientX, e.clientY);
    const speed = (e.clientX - p.hoverX) / Math.max(1, now - p.hoverT);
    p.hoverX = e.clientX;
    p.hoverT = now;

    if (s.size.carousel) {
      const activeIdx = s.active ?? s.carouselIndex;
      if (hit !== null && hit === activeIdx && s.active !== hit) {
        stopAutoplay();
        setActive(hit);
      }
      return;
    }
    if (hit !== null && hit !== p.hoverHit) {
      impulseSwing(hit, clamp(-speed * 22, -24, 24));
    }
    p.hoverHit = hit ?? -1;
    if (hit !== null && hit !== s.active) {
      stopAutoplay();
      setActive(hit);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const hit = nearest(e.clientX, e.clientY);
    const now = performance.now();
    pendingClick.current = -1;
    pointerState.current = {
      ...pointerState.current,
      id: e.pointerId,
      index: hit ?? -1,
      x: e.clientX,
      y: e.clientY,
      mode: "",
      kind: e.pointerType,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: now,
      v: 0,
      swipe: 0,
    };
  };

  const finishPointer = (e: React.PointerEvent, cancel = false) => {
    const p = pointerState.current;
    if (p.id !== e.pointerId) return;
    const sim = simRef.current;
    const s = stateRef.current;
    const stage = stageRef.current;

    if (stage?.hasPointerCapture(e.pointerId)) {
      stage.releasePointerCapture(e.pointerId);
    }
    pointerState.current = { ...p, id: -1 };

    if (p.mode === "pull") {
      const idx = sim.pull;
      sim.pull = -1;
      if (s.reduced) {
        sim.st[idx] = 0;
        sim.vst[idx] = 0;
        sim.sw[idx] = 0;
        sim.vsw[idx] = 0;
        sim.beta[idx] = 0;
        paint(idx);
      } else {
        wake();
      }
      return;
    }

    if (p.mode === "drag") {
      sim.drag = -1;
      sim.free = performance.now() + 700;
      wake();
      return;
    }

    if (p.mode === "swipe") {
      const dx = e.clientX - p.x;
      const c = s.count;
      const cur = s.active ?? s.carouselIndex;
      const dir =
        Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0;
      pointerState.current.swipe = 0;
      const next = s.cyclic
        ? (((cur + dir) % c) + c) % c
        : clamp(cur + dir, 0, c - 1);
      if (next === s.active) retarget();
      else setActive(next);
      return;
    }

    if (!cancel && !p.mode && p.index >= 0) {
      stopAutoplay();
      if ((p.kind !== "mouse" || s.size.carousel) && s.active !== p.index) {
        setActive(p.index);
      } else {
        pendingClick.current = p.index;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = stateRef.current;
    if (e.key === "Escape") {
      if (s.flipped !== null) {
        e.preventDefault();
        setFlipped(null);
      }
      return;
    }
    const target = e.target instanceof HTMLElement ? e.target : null;
    const badgeIdx = target?.dataset.badge;

    if (e.key === "ArrowDown") {
      if (badgeIdx === undefined) return;
      e.preventDefault();
      stopAutoplay();
      impulseReel(Number(badgeIdx), 300);
      return;
    }

    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    stopAutoplay();
    const cur = s.active ?? focusIdx;
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
        ? s.count - 1
        : clamp(cur + (e.key === "ArrowRight" ? 1 : -1), 0, s.count - 1);
    setFocusIdx(next);
    setActive(next);
    badgeBtnRefs.current[next]?.focus({ preventScroll: true });
  };

  const k = geo;
  const cardW = k.W;
  const fontSize = cardW / BASE_FONT;
  const selIdx = currentActive ?? currentFlipped;
  const selItem = selIdx === null ? null : items[selIdx] ?? null;
  const isBack = selIdx !== null && selIdx === currentFlipped;
  const carouselActive = size.carousel
    ? currentActive ?? stateRef.current.carouselIndex
    : null;
  const captionText = selItem ? `${selItem.name} — ${selItem.role}` : caption;
  const flipHint = selItem ? (isBack ? labels.back : labels.flip) : "";

  return (
    <section
      {...rest}
      data-slot="team-lanyard-rail"
      data-mode={size.carousel ? "carousel" : "rail"}
      data-active={currentActive ?? ""}
      data-flipped={currentFlipped ?? ""}
      className={`relative isolate w-full overflow-hidden bg-background text-foreground ${
        className ?? ""
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(closest-side at 50% 46%, color-mix(in oklab, var(--color-foreground) 7%, transparent), transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(color-mix(in oklab, var(--color-foreground) 8%, transparent) 1px, transparent 1.3px) 0 0 / 18px 18px",
          maskImage:
            "radial-gradient(closest-side at 50% 50%, black 55%, transparent)",
          WebkitMaskImage:
            "radial-gradient(closest-side at 50% 50%, black 55%, transparent)",
        }}
      />

      {(eyebrow || heading) && (
        <header className="relative z-10 flex flex-col items-center gap-2 px-6 pt-7 text-center">
          {eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2 className="text-balance text-2xl font-medium tracking-tight md:text-3xl">
              {heading}
            </h2>
          )}
        </header>
      )}

      <div
        ref={stageRef}
        data-stage
        role="group"
        aria-label={heading ?? "Team"}
        aria-roledescription="lanyard rail"
        className="relative mt-4 w-full touch-pan-y select-none"
        style={{ height: k.height, overflowX: "clip" }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={(e) => finishPointer(e, false)}
        onPointerCancel={(e) => finishPointer(e, true)}
        onPointerLeave={(e) => {
          pointerState.current.hoverHit = -1;
          if (
            e.pointerType === "mouse" &&
            pointerState.current.id < 0 &&
            !size.carousel &&
            !document.activeElement?.matches("[data-badge]:focus-visible")
          ) {
            setActive(null);
          }
        }}
        onKeyDown={onKeyDown}
      >
        {/* Metal rail */}
        <div
          aria-hidden="true"
          data-rail
          className="pointer-events-none absolute inset-x-0 z-0"
          style={{ top: k.railY - k.railR, height: k.railR * 2 }}
        >
          <div
            className="absolute inset-x-0 h-3 rounded-full bg-foreground/10 blur-[5px]"
            style={{ top: k.railR * 2 + 2 }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--color-muted-foreground) 35%, white) 0%, white 20%, color-mix(in oklab, var(--color-muted-foreground) 70%, white) 40%, var(--color-muted-foreground) 64%, color-mix(in oklab, var(--color-muted-foreground) 55%, black) 100%)",
              boxShadow:
                "0 1px 0 color-mix(in oklab, var(--color-foreground) 18%, transparent)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in oklab, white 40%, transparent) 2px 3px, transparent 3px 7px)",
            }}
          />
          {!size.carousel &&
            [0, 1].map((side) => (
              <div
                key={side}
                className="absolute top-1/2 h-7 w-4 -translate-y-1/2 rounded-[3px]"
                style={{
                  [side ? "right" : "left"]: 6,
                  background:
                    "linear-gradient(to right, color-mix(in oklab, var(--color-muted-foreground) 60%, white), var(--color-muted-foreground) 55%, color-mix(in oklab, var(--color-muted-foreground) 60%, black))",
                  boxShadow:
                    "0 3px 6px color-mix(in oklab, var(--color-foreground) 18%, transparent)",
                }}
              >
                <span className="absolute left-1/2 top-1 size-1 -translate-x-1/2 rounded-full bg-foreground/35" />
                <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/35" />
              </div>
            ))}
        </div>

        {/* Lanyards & Badges */}
        {items.map((item, i) => {
          const toneClass =
            TONES[(((item.tone ?? (i % 5) + 1) - 1) % TONES.length)] ?? TONES[0];
          const isAct = currentActive === i;
          const isFlp = currentFlipped === i;
          const strapLen = k.straps[i] ?? 0;
          const reelY = k.reelTops[i] ?? 0;
          const clipY = k.clipTops[i] ?? 0;
          const cardOffsetY = (k.cardTops[i] ?? 0) - clipY;
          const links = (item.links ?? []).slice(0, 3);

          return (
            <div
              key={item.id}
              ref={(el) => {
                lanyardRefs.current[i] = el;
              }}
              data-lanyard={i}
              className={`pointer-events-none absolute left-0 top-0 ${toneClass}`}
              style={{
                width: cardW,
                height: k.height,
                zIndex: isFlp ? 40 : isAct ? 30 : 10 + i,
                transform: `translate3d(${((simRef.current.x[i] ?? 0) - cardW / 2).toFixed(
                  2
                )}px,0,0)`,
              }}
            >
              {/* Rail Trolley Ring */}
              <span
                aria-hidden="true"
                className="absolute block rounded-full"
                style={{
                  left: cardW / 2 - 4.5 * k.u,
                  top: k.railY - k.ring,
                  width: 9 * k.u,
                  height: k.ring * 2,
                  border: `${Math.max(1.6, 2.2 * k.u).toFixed(
                    2
                  )}px solid color-mix(in oklab, var(--color-muted-foreground) 45%, white)`,
                  boxShadow:
                    "inset 1px 0 0 color-mix(in oklab, black 25%, transparent), 1px 1px 2px color-mix(in oklab, black 20%, transparent)",
                }}
              />

              {/* Swing Group */}
              <span
                ref={(el) => {
                  swingRefs.current[i] = el;
                }}
                data-swing
                className="absolute inset-0 block"
                style={{ transformOrigin: `${cardW / 2}px ${k.pivotY}px` }}
              >
                {/* Strap & Reel */}
                <span
                  ref={(el) => {
                    strapRefs.current[i] = el;
                  }}
                  data-strap
                  aria-hidden="true"
                  className="absolute inset-0 block"
                  style={{ "--stretch": "0px" } as React.CSSProperties}
                >
                  <span
                    className="absolute block bg-black/15 blur-[2px] dark:bg-black/45"
                    style={{
                      left: cardW / 2 - k.strapW / 2 + 3 * k.u,
                      top: k.pivotY + 3,
                      width: k.strapW,
                      height: strapLen,
                    }}
                  />
                  <span
                    className="absolute block"
                    style={{
                      left: cardW / 2 - k.strapW / 2,
                      top: k.pivotY - 2,
                      width: k.strapW,
                      height: strapLen + 2,
                      background: [
                        "repeating-linear-gradient(135deg, color-mix(in oklab, white 16%, transparent) 0 1px, transparent 1px 3px)",
                        "repeating-linear-gradient(45deg, color-mix(in oklab, black 13%, transparent) 0 1px, transparent 1px 3px)",
                        "linear-gradient(90deg, color-mix(in oklab, currentColor 68%, black) 0%, currentColor 16%, color-mix(in oklab, currentColor 86%, white) 48%, currentColor 80%, color-mix(in oklab, currentColor 66%, black) 100%)",
                      ].join(","),
                    }}
                  >
                    <span className="absolute inset-y-0 left-[1.5px] right-[1.5px] block border-x border-dashed border-white/35" />
                    <span
                      className="absolute inset-x-0 top-0 block bg-black/25"
                      style={{ height: 7 * k.u }}
                    />
                    <span
                      className="absolute inset-x-[2px] block border-t border-dashed border-white/45"
                      style={{ top: 9 * k.u }}
                    />
                  </span>
                  <svg
                    aria-hidden="true"
                    className="absolute overflow-visible"
                    style={{
                      left: cardW / 2 - k.strapW * 0.75,
                      top: k.pivotY - 4 * k.u,
                      width: k.strapW * 1.5,
                      height: 8 * k.u,
                    }}
                    viewBox="0 0 30 16"
                    preserveAspectRatio="none"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="26"
                      height="10"
                      rx="5"
                      fill="none"
                      stroke="color-mix(in oklab, var(--color-muted-foreground) 40%, white)"
                      strokeWidth="3"
                    />
                    <path d="M7 4.5 H23" stroke="white" strokeOpacity="0.6" strokeWidth="1" />
                  </svg>
                  <span
                    className="absolute block rounded-[2px]"
                    style={{
                      left: cardW / 2 - k.strapW / 2 - 1.5,
                      top: k.pivotY + strapLen - k.crimp * 0.4,
                      width: k.strapW + 3,
                      height: k.crimp,
                      background: METAL_SHINE,
                      boxShadow: "0 1px 1.5px color-mix(in oklab, black 30%, transparent)",
                    }}
                  />
                  <span
                    className="absolute block rounded-full"
                    style={{
                      left: cardW / 2 - k.reel / 2,
                      top: reelY,
                      width: k.reel,
                      height: k.reel,
                      background:
                        "radial-gradient(circle at 34% 30%, color-mix(in oklab, var(--color-foreground) 48%, var(--color-background)) 0%, var(--color-foreground) 58%, color-mix(in oklab, var(--color-foreground) 82%, var(--color-background)) 100%)",
                      boxShadow:
                        "inset 0 -1px 2px color-mix(in oklab, black 40%, transparent), 0 2px 3px color-mix(in oklab, black 28%, transparent)",
                    }}
                  >
                    <span className="absolute inset-[14%] block rounded-full border border-white/20" />
                    <span
                      className="absolute left-1/2 top-1/2 block size-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: METAL_SHINE }}
                    />
                  </span>
                  <span
                    ref={(el) => {
                      cordRefs.current[i] = el;
                    }}
                    className="absolute block w-[1.5px] bg-foreground/60"
                    style={{
                      left: cardW / 2 - 0.75,
                      top: reelY + k.reel * 0.82,
                      height: k.cordRest,
                      transformOrigin: "50% 0",
                    }}
                  />
                </span>

                {/* Hang Group */}
                <span
                  ref={(el) => {
                    hangRefs.current[i] = el;
                  }}
                  data-hang
                  className="absolute left-0 block"
                  style={{
                    top: clipY,
                    width: cardW,
                    height: cardOffsetY + k.H,
                    transformOrigin: `${cardW / 2}px 0px`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 block"
                    style={{
                      top: cardOffsetY,
                      width: cardW,
                      height: k.H,
                      filter: `blur(${Math.max(4, 8 * k.u).toFixed(1)}px)`,
                    }}
                  >
                    <span
                      ref={(el) => {
                        shadowRefs.current[i] = el;
                      }}
                      data-shadow
                      className="absolute inset-0 block rounded-[10px] bg-black/25 dark:bg-black/70"
                    />
                  </span>

                  <button
                    ref={(el) => {
                      badgeBtnRefs.current[i] = el;
                    }}
                    type="button"
                    data-badge={i}
                    data-flipped={isFlp ? "true" : "false"}
                    data-active={isAct || undefined}
                    tabIndex={i === (currentActive ?? focusIdx) ? 0 : -1}
                    aria-label={`${item.name}, ${item.role}`}
                    aria-describedby={`${uid}-caption`}
                    aria-pressed={isFlp}
                    className="pointer-events-auto absolute left-0 cursor-pointer rounded-[0.85em] p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    style={{
                      top: cardOffsetY,
                      width: cardW,
                      height: k.H,
                      fontSize,
                    }}
                    onFocus={() => {
                      setFocusIdx(i);
                      if (pointerState.current.id < 0) {
                        stopAutoplay();
                        setActive(i);
                      }
                    }}
                    onClick={(e) => {
                      const p = pendingClick.current;
                      pendingClick.current = -1;
                      if (e.detail === 0 || p === i) {
                        toggleFlip(i);
                      }
                    }}
                  >
                    <span
                      ref={(el) => {
                        flipRefs.current[i] = el;
                      }}
                      data-flip
                      className="absolute inset-0 block [transform-style:preserve-3d]"
                      style={{
                        transform: `perspective(${PERSPECTIVE}px) rotateY(${
                          REST_BETA[i % REST_BETA.length] ?? 0
                        }deg)`,
                      }}
                    >
                      <BadgeFaces item={item} tone={toneClass} />
                    </span>
                  </button>

                  {/* Metal Bulldog Clip Cutout */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute block"
                    style={{
                      left: cardW / 2 - k.clipW / 2,
                      top: 0,
                      width: k.clipW,
                      height: k.clipH + 10 * k.u,
                    }}
                  >
                    <span
                      className="absolute left-1/2 block -translate-x-1/2 rounded-b-[2px]"
                      style={{
                        top: k.clipH * 0.7,
                        width: k.clipW * 0.42,
                        height: cardOffsetY - k.clipH * 0.7 + 0.72 * fontSize + 0.3 * fontSize,
                        background: CLIP_SHADE,
                      }}
                    />
                    <span
                      className="absolute inset-x-0 top-0 block"
                      style={{
                        height: k.clipH,
                        clipPath: "polygon(24% 0, 76% 0, 100% 72%, 94% 100%, 6% 100%, 0 72%)",
                        background: CLIP_SHADE,
                      }}
                    />
                    <span
                      className="absolute block bg-white/50"
                      style={{ left: "30%", right: "30%", top: 1, height: 1 }}
                    />
                    <span
                      className="absolute left-1/2 block -translate-x-1/2 rounded-full bg-background"
                      style={{
                        top: k.clipH * 0.14,
                        width: k.clipH * 0.34,
                        height: k.clipH * 0.34,
                        boxShadow:
                          "inset 0 1px 1px color-mix(in oklab, black 45%, transparent)",
                      }}
                    />
                  </span>

                  {/* Accessible Back-face Links */}
                  {isFlp && links.length > 0 && (
                    <div
                      ref={(el) => {
                        linksRefs.current[i] = el;
                      }}
                      data-links
                      className="pointer-events-none absolute left-0 transition-opacity duration-150 motion-reduce:transition-none"
                      style={{
                        top: cardOffsetY,
                        width: cardW,
                        height: k.H,
                        fontSize,
                        opacity: 0,
                        visibility: "hidden",
                      }}
                    >
                      <div className="absolute bottom-[0.75em] left-[0.6em] flex flex-col items-start gap-[0.1em]">
                        {links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              stopAutoplay();
                            }}
                            onFocus={stopAutoplay}
                            className={`${LINK_CLS} pointer-events-auto text-card-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring`}
                          >
                            <LinkIcon label={link.label} />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </span>
              </span>
            </div>
          );
        })}

        {/* Carousel gradient edges */}
        {size.carousel && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-50 w-12 bg-gradient-to-r from-background from-25% to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-50 w-12 bg-gradient-to-l from-background from-25% to-transparent"
            />
          </>
        )}
      </div>

      {/* Mobile Dots */}
      {size.carousel && count > 1 && (
        <div
          className="relative z-10 mt-1 flex justify-center gap-1.5"
          role="group"
          aria-label={labels.show}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${labels.show} ${item.name}`}
              aria-current={carouselActive === i}
              onClick={() => {
                stopAutoplay();
                setActive(i);
              }}
              className={`h-1.5 rounded-full outline-none transition-[width,background-color] duration-300 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                carouselActive === i
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
              }`}
            />
          ))}
        </div>
      )}

      {/* Footer Caption & Action slot */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 pb-7 pt-3 text-center">
        <div id={`${uid}-caption`} aria-live="polite" className="min-h-[2.6rem]">
          <p className="text-sm font-medium">{captionText}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{flipHint}</p>
          {isBack && selItem?.bio && (
            <span className="sr-only">{selItem.bio}</span>
          )}
        </div>
        {action}
      </div>
    </section>
  );
}
