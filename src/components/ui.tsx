import { useEffect, useRef, useState, type ReactNode } from "react";
import { StarIcon, FlowerIcon, SwirlIcon, HeartIcon, BoltIcon, SparkIcon } from "./Icons";

/* ---------- scroll reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- marquee ---------- */
export function Marquee({
  items,
  className = "",
  speed = 26,
}: {
  items: string[];
  className?: string;
  speed?: number;
}) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-5 pr-5 font-display text-sm font-bold uppercase tracking-[0.18em]">
          <StarIcon size={15} className="shrink-0" />
          <span className="whitespace-nowrap">{it}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee overflow-hidden border-y-2 border-ink py-2.5 ${className}`} aria-hidden>
      <div className="marquee-track" style={{ ["--speed" as string]: `${speed}s` }}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ---------- doodle ambience ---------- */
const DOODLES = [
  { C: StarIcon, cls: "left-[4%] top-[16%] text-tang", size: 34, rot: "-8deg", dur: "7s" },
  { C: FlowerIcon, cls: "right-[6%] top-[10%] text-pine", size: 40, rot: "10deg", dur: "8.5s" },
  { C: SwirlIcon, cls: "left-[10%] top-[58%] text-leaf", size: 36, rot: "0deg", dur: "9s" },
  { C: HeartIcon, cls: "right-[12%] top-[44%] text-tang-deep", size: 30, rot: "14deg", dur: "6.5s" },
  { C: SparkIcon, cls: "left-[46%] top-[30%] text-pine", size: 26, rot: "-12deg", dur: "7.8s" },
  { C: BoltIcon, cls: "right-[38%] top-[68%] text-leaf", size: 30, rot: "8deg", dur: "8.2s" },
  { C: StarIcon, cls: "left-[22%] top-[84%] text-pine", size: 26, rot: "16deg", dur: "7.2s" },
  { C: FlowerIcon, cls: "right-[20%] top-[88%] text-tang", size: 32, rot: "-6deg", dur: "9.5s" },
];

export function DoodleField() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden opacity-50 lg:block" aria-hidden>
      {DOODLES.map((d, i) => (
        <span
          key={i}
          className={`anim-floaty absolute ${d.cls}`}
          style={{ ["--rot" as string]: d.rot, animationDuration: d.dur }}
        >
          <d.C size={d.size} />
        </span>
      ))}
    </div>
  );
}

/* ---------- chips ---------- */
export function MonoChip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink/25 bg-paper px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: "ok" | "warn" | "busy" }) {
  const map = { ok: "bg-leaf", warn: "bg-tang", busy: "bg-berry" };
  return <span className={`anim-blink inline-block h-2.5 w-2.5 rounded-full border border-ink ${map[tone]}`} />;
}

export function SectionHead({
  kicker,
  title,
  sub,
  tone = "light",
}: {
  kicker: string;
  title: ReactNode;
  sub?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="mb-10 max-w-2xl">
      <span
        className={`sticker-sm inline-block -rotate-2 rounded-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${
          dark ? "bg-leaf text-ink" : "bg-tang text-ink"
        }`}
      >
        {kicker}
      </span>
      <h2
        className={`mt-5 font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-extrabold leading-[1.02] tracking-tight ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {sub && <p className={`mt-4 text-base font-medium leading-relaxed ${dark ? "text-mint" : "text-ink/70"}`}>{sub}</p>}
    </div>
  );
}
