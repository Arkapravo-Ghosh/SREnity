"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Activity,
  Clock,
  Hash,
  History,
  ListChecks,
  MessageSquareText,
  FileText,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SREnityMark } from "./Logo";

/*
 * The "one platform" story as a live evidence trace. Sources stream into SREnity's context layer;
 * one trace at a time lights up end to end, from a raw source record through the core to the output
 * line it supports. Every record and claim comes from the WAN demo incident (INC0012346), so the
 * figures agree with the live demo above.
 */

type Source = { icon: LucideIcon; name: string; system: string; record: string };
type Output = { icon: LucideIcon; name: string; short: string; claim: string; cite: string; source: number };

const SOURCES: Source[] = [
  {
    icon: Ticket,
    name: "Ticket & field history",
    system: "ITSM tool",
    record: "INC0012346 · P2 · WAN-LINK-KOL-CHN-01 · 3 reassignments · 3 past faults",
  },
  {
    icon: MessageSquareText,
    name: "Work notes",
    system: "ITSM tool",
    record: "10:36 · “Branch traffic moved to backup LTE link. Users recovering.”",
  },
  {
    icon: Hash,
    name: "Team chat",
    system: "Slack / Teams",
    record: "10:18 · #noc-kolkata · “bounced the WAN port on kol-edge-01, still dropping”",
  },
  {
    icon: Activity,
    name: "Monitoring alerts",
    system: "Monitoring platform",
    record: "10:08 ALARM · WAN-LINK-KOL-CHN-01 · loss 2.6% · RTT 162 ms",
  },
];

/** Listed in demo-tab order; `source` is the index of the record each claim is cited to. */
const OUTPUTS: Output[] = [
  { icon: Clock, name: "Timeline", short: "Timeline", claim: "10:08 · Loss and latency alarm on the Kolkata–Chennai WAN link", cite: "Monitoring · alarm 10:08", source: 3 },
  { icon: ListChecks, name: "Already tried", short: "Tried", claim: "Bounced the edge router port at 10:18: did not work, loss stayed above 3%.", cite: "Chat · 10:18 + alarm", source: 2 },
  { icon: History, name: "Similar incidents", short: "History", claim: "Third carrier fault on this circuit; failing over to backup restored users every time.", cite: "Ticket history · INC0011872", source: 0 },
  { icon: FileText, name: "PIR · RCA", short: "PIR", claim: "The fault lies past the ISP handoff, inside the carrier network.", cite: "Work note · 10:21 traceroute", source: 1 },
];

const CYCLE_MS = 3600;

type Point = { x: number; y: number };
type Geometry = { w: number; h: number; src: Point[]; out: Point[]; coreIn: Point; coreOut: Point };

/** Horizontal S-curve between two anchors. */
function curve(a: Point, b: Point) {
  const dx = (b.x - a.x) / 2;
  return `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Packets travelling along a path. Hidden until their first cycle begins. */
function Packets({ path, count, dur, className, r = 3 }: { path: string; count: number; dur: number; className: string; r?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const begin = `${(i * dur) / count}s`;
        return (
          <circle key={i} r={r} cx={0} cy={0} opacity={0} className={className}>
            <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={path} />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
          </circle>
        );
      })}
    </>
  );
}

/**
 * Phones: one trace at a time instead of the eight-card diagram. Pick an output; the card shows its
 * claim, the source record it is cited to, and SREnity linking the two. Text boxes keep a minimum
 * height so the card doesn't jump as the trace cycles.
 */
function MobileTrace({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  const out = OUTPUTS[active]!;
  const src = SOURCES[out.source]!;
  return (
    <div className="p-4 sm:hidden">
      <div role="group" aria-label="Output" className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-background/50 p-1">
        {OUTPUTS.map((o, i) => {
          const on = i === active;
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => onPick(i)}
              aria-pressed={on}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium transition-colors duration-300",
                on ? "bg-signal-soft text-signal ring-1 ring-signal/50" : "text-muted-foreground",
              )}
            >
              <o.icon className="h-4 w-4" />
              {o.short}
            </button>
          );
        })}
      </div>

      <div key={active} className="pop-in mt-4">
        {/* Source record */}
        <div className="rounded-md border border-border bg-background/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] text-foreground">
              <src.icon className="h-4 w-4 shrink-0 text-signal" />
              {src.name}
            </span>
            <span className="label-mono shrink-0 text-[9.5px] text-muted-foreground">{src.system}</span>
          </div>
          <p className="mt-1.5 min-h-8 font-mono text-[11px] leading-4 text-muted-foreground">{src.record}</p>
        </div>

        {/* SREnity links the record to the claim */}
        <div className="relative flex h-11 items-center pl-[22px]">
          <span className="absolute inset-y-0 left-[22px] w-px bg-signal/50" aria-hidden />
          <span className="trace-drop absolute left-[20px] top-0 h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
          <span className="relative -ml-[11px] grid h-[22px] w-[22px] place-items-center rounded-full border border-signal/60 bg-card">
            <SREnityMark className="h-2.5 w-auto" />
          </span>
          <span className="label-mono ml-2.5 text-[10px] text-signal">SREnity cites it</span>
        </div>

        {/* Output claim */}
        <div className="rounded-md border border-signal/70 bg-signal-soft px-3 py-2.5 shadow-[0_0_28px_-10px_var(--color-signal)]">
          <div className="flex items-center gap-2 text-[13px] text-foreground">
            <out.icon className="h-4 w-4 shrink-0 text-signal" />
            {out.name}
          </div>
          <p className="mt-1.5 min-h-15 text-sm leading-snug text-foreground">{out.claim}</p>
          <span className="label-mono mt-1 inline-flex rounded border border-signal/50 px-1.5 py-0.5 text-[9.5px] text-signal">
            ← {out.cite}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ContextEngine() {
  const [active, setActive] = useState(2);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const reduced = useReducedMotion();

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const srcRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const outRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeSource = OUTPUTS[active]!.source;

  // Measure anchor points so the connectors meet the real card edges at any width.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      const edge = (el: Element | null, side: "left" | "right"): Point => {
        const r = el?.getBoundingClientRect();
        if (!r) return { x: 0, y: 0 };
        return { x: (side === "left" ? r.left : r.right) - base.left, y: r.top + r.height / 2 - base.top };
      };
      setGeo({
        w: base.width,
        h: base.height,
        src: srcRefs.current.map((el) => edge(el, "right")),
        out: outRefs.current.map((el) => edge(el, "left")),
        coreIn: edge(coreRef.current, "left"),
        coreOut: edge(coreRef.current, "right"),
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Only cycle while on screen. Watches the card, which is visible at every width (the diagram is
  // hidden on phones).
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(!!entries[0]?.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || reduced) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % OUTPUTS.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, inView, reduced]);

  const traceSource = (i: number) => setActive(OUTPUTS.findIndex((o) => o.source === i));

  return (
    <div ref={cardRef} className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <span className="label-mono truncate text-muted-foreground">
          02.1 · Context layer<span className="max-sm:hidden"> · INC0012346</span>
        </span>
        <span className="label-mono inline-flex shrink-0 items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          Live trace
        </span>
      </div>

      <MobileTrace
        active={active}
        onPick={(i) => {
          setActive(i);
          setPaused(true);
        }}
      />

      <div
        ref={wrapRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative grid gap-y-4 p-5 max-sm:hidden sm:p-6 lg:grid-cols-[minmax(0,1fr)_200px_minmax(0,1fr)] lg:gap-x-20 lg:p-8"
      >
        {/* Connectors: every source streams in; the active trace runs through to its output. */}
        {geo && (
          <svg
            className="pointer-events-none absolute inset-0 hidden lg:block"
            width={geo.w}
            height={geo.h}
            aria-hidden
          >
            {geo.src.map((p, i) => (
              <path
                key={`s${i}`}
                d={curve(p, geo.coreIn)}
                fill="none"
                strokeWidth={i === activeSource ? 2 : 1.25}
                className={cn("transition-colors duration-500", i === activeSource ? "stroke-signal" : "stroke-border")}
              />
            ))}
            {geo.out.map((p, i) => (
              <path
                key={`o${i}`}
                d={curve(geo.coreOut, p)}
                fill="none"
                strokeWidth={i === active ? 2 : 1.25}
                strokeDasharray={i === active ? undefined : "3 5"}
                className={cn("transition-colors duration-500", i === active ? "stroke-signal" : "stroke-border")}
              />
            ))}
            {!reduced && (
              <>
                {geo.src.map((p, i) =>
                  i === activeSource ? null : (
                    <Packets key={`a${i}`} path={curve(p, geo.coreIn)} count={1} dur={2.8} r={2} className="fill-muted-foreground" />
                  ),
                )}
                <g key={`trace-${active}`}>
                  <Packets path={curve(geo.src[activeSource]!, geo.coreIn)} count={3} dur={1.4} className="fill-signal" />
                  <Packets path={curve(geo.coreOut, geo.out[active]!)} count={3} dur={1.4} className="fill-signal" />
                </g>
              </>
            )}
          </svg>
        )}

        {/* Sources */}
        <div className="relative flex flex-col">
          <div className="label-mono mb-3 text-[10px] text-muted-foreground">Sources · pulled read-only</div>
          <div className="grid flex-1 gap-2.5 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-1">
            {SOURCES.map((s, i) => {
              const on = i === activeSource;
              return (
                <button
                  key={s.name}
                  type="button"
                  ref={(el) => {
                    srcRefs.current[i] = el;
                  }}
                  onMouseEnter={() => traceSource(i)}
                  onFocus={() => traceSource(i)}
                  onClick={() => {
                    traceSource(i);
                    setPaused(true);
                  }}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-500",
                    on
                      ? "border-signal/70 bg-signal-soft shadow-[0_0_28px_-10px_var(--color-signal)]"
                      : "border-border bg-background/50 hover:border-foreground/25",
                  )}
                >
                  <span className="flex w-full items-center gap-2.5">
                    <s.icon className={cn("h-4 w-4 shrink-0", on ? "text-signal" : "text-muted-foreground")} />
                    <span className="flex-1 text-[13px] text-foreground">{s.name}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 line-clamp-2 block min-h-8 font-mono text-[10.5px] leading-4 transition-colors duration-500",
                      on ? "text-signal" : "text-muted-foreground/70",
                    )}
                  >
                    {s.record}
                  </span>
                  <span
                    className={cn(
                      "label-mono mt-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9.5px] transition-opacity duration-500",
                      on ? "border-signal/50 text-signal opacity-100" : "border-border text-muted-foreground opacity-60",
                    )}
                  >
                    {s.system} →
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto h-6 w-px bg-signal/50 lg:hidden" aria-hidden />

        {/* Core */}
        <div className="relative flex items-center">
          <div
            ref={coreRef}
            className="mx-auto flex w-full max-w-[220px] flex-col items-center rounded-xl border border-signal/50 bg-background/80 px-4 py-6 text-center shadow-[0_0_70px_-18px_var(--color-signal)]"
          >
            <div className="relative grid h-20 w-20 place-items-center">
              <svg viewBox="0 0 80 80" className="absolute inset-0 animate-[spin_16s_linear_infinite] motion-reduce:animate-none" aria-hidden>
                <circle cx="40" cy="40" r="38" fill="none" className="stroke-signal/70" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 80 80" className="absolute inset-0" aria-hidden>
                <circle cx="40" cy="40" r="29" fill="none" className="stroke-signal/25" strokeWidth="1" />
              </svg>
              <SREnityMark className="h-6 w-auto" />
            </div>
            <div className="font-display mt-3 text-lg text-foreground">SREnity</div>
            <div className="label-mono mt-1 text-[10px] text-signal">Context layer</div>
            <div className="mt-4 w-full border-t border-signal/25 pt-3 font-mono text-[10.5px] leading-snug">
              <div className="text-muted-foreground">linking evidence</div>
              <div key={active} className="pop-in mt-1.5 space-y-0.5 text-foreground">
                <div>{OUTPUTS[active]!.cite}</div>
                <div className="text-signal">↓</div>
                <div>{OUTPUTS[active]!.name}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto h-6 w-px bg-signal/50 lg:hidden" aria-hidden />

        {/* Outputs */}
        <div className="relative flex flex-col">
          <div className="label-mono mb-3 text-[10px] text-muted-foreground">Outputs · every line cited</div>
          <div className="grid flex-1 gap-2.5 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-1">
            {OUTPUTS.map((o, i) => {
              const on = i === active;
              return (
                <button
                  key={o.name}
                  type="button"
                  ref={(el) => {
                    outRefs.current[i] = el;
                  }}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => {
                    setActive(i);
                    setPaused(true);
                  }}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-500",
                    on
                      ? "border-signal/70 bg-signal-soft shadow-[0_0_28px_-10px_var(--color-signal)]"
                      : "border-border bg-background/50 hover:border-foreground/25",
                  )}
                >
                  <span className="flex w-full items-center gap-2.5">
                    <o.icon className={cn("h-4 w-4 shrink-0", on ? "text-signal" : "text-muted-foreground")} />
                    <span className="flex-1 text-[13px] text-foreground">{o.name}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 line-clamp-2 block min-h-9 text-[12.5px] leading-[18px] transition-colors duration-500",
                      on ? "text-foreground" : "text-muted-foreground/70",
                    )}
                  >
                    {o.claim}
                  </span>
                  <span
                    className={cn(
                      "label-mono mt-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9.5px] transition-opacity duration-500",
                      on ? "border-signal/50 text-signal opacity-100" : "border-border text-muted-foreground opacity-40",
                    )}
                  >
                    ← {o.cite}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-5 py-3">
        <span className="label-mono rounded border border-dashed border-alert/60 px-2 py-1 text-[10px] text-alert">
          Gap flagged
        </span>
        <span className="text-xs text-muted-foreground">
          Carrier fault start time: in none of the sources, so SREnity says so instead of guessing.
        </span>
        <span className="label-mono ml-auto hidden text-[10px] text-muted-foreground lg:inline">
          Hover a source or output to trace it
        </span>
      </div>
    </div>
  );
}
