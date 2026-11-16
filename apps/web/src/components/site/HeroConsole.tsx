"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroLoop, type LoopAnchors, type Point } from "./HeroLoop";
import { SREnityMark } from "./Logo";

/*
 * Interactive hero diagram. The DevOps loop is broken on the Ops side by a P2. The visitor clicks
 * the gap (or it starts on its own), SREnity reads the incident from Ops, teal fills the gap, and
 * the deliverables — ending in action items — flow back to the Dev side. Callout cards are tied to
 * the exact points on the loop they describe.
 */

const AUTO_START = 7000;
const AGENT_STEPS = [800, 1900, 3000];
const DELIVER_AT = 3400;
const DELIVER_STEPS = [3900, 4350, 4800, 5250, 5700];
const CLOSED_AT = 5700;
const TICK_MS = 100;

export const AGENT_LINES = [
  "Read 14 work notes and 2 chat threads",
  "Matched the WAN alarm to ROUTER-BLR-0042",
  "2 fixes tried · 1 confirmed by monitoring",
];
/** What the next shift gets, in the order the demo shows it. */
export const DELIVERABLES = ["Incident timeline", "What was already tried", "Similar past incidents", "PIR report"];
const PHASES = ["Raised", "Investigating", "Handed over", "Resolved"];
/** Ticket fields on the alert card, before and after the router is replaced.
 * Two rows only: any taller and the card covers the gap's leader line on the loop. */
const INCIDENT_FIELDS = [
  ["Impact", "1 – High"],
  ["Urgency", "2 – Medium"],
];
const RESOLVED_FIELDS = [
  ["Code", "Hardware replaced"],
  ["Notes", "WAN link restored"],
];

type Run = { started: boolean; t: number; auto: boolean };
type Rect = { left: number; top: number; width: number; height: number };
type CardKey = "alert" | "agent" | "deliver";

/** Keep asset IDs like ROUTER-BLR-0042 whole instead of letting them break at a hyphen. */
export function keepIds(text: string) {
  return text
    .split(/([A-Z]+(?:-[A-Z0-9]+){2,})/)
    .map((part, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part));
}

/** Simulated incident clock: 02:11:00 UTC at the page, ~4 minutes to a full set of deliverables. */
export function clock(fraction: number) {
  const secs = Math.round(fraction * 240);
  const m = 11 + Math.floor(secs / 60);
  return `02:${String(m).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")} UTC`;
}

/** Closest point on a rectangle to `p`, so a leader line meets the card's nearest edge. */
function nearestOnRect(p: Point, r: Rect): Point {
  return {
    x: Math.max(r.left, Math.min(p.x, r.left + r.width)),
    y: Math.max(r.top, Math.min(p.y, r.top + r.height)),
  };
}

/** `show`: visible from sm up, where all cards sit around the loop. `current`: the one card phones show. */
function Card({
  show,
  current,
  cardRef,
  onHover,
  className,
  children,
}: {
  show: boolean;
  current: boolean;
  cardRef: RefObject<HTMLDivElement | null>;
  onHover: (on: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={cardRef}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "tone-light relative rounded-xl border border-border bg-card p-4 text-foreground shadow-[0_24px_48px_-20px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out max-sm:[grid-area:1/1] sm:absolute",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        !current && "max-sm:pointer-events-none max-sm:translate-y-3 max-sm:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Tick({ done, active }: { done: boolean; active?: boolean }) {
  return (
    <span
      className={cn(
        "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        done ? "border-signal bg-signal text-white" : active ? "border-foreground" : "border-border",
      )}
    >
      {done ? (
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      ) : active ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
      ) : null}
    </span>
  );
}

/** Customers online behind the router: the drop at 02:11, and the recovery once it's replaced. */
function Connectivity({ resolved }: { resolved: boolean }) {
  return (
    <svg viewBox="0 0 120 32" className="h-7 w-full" aria-hidden>
      <polyline
        points="0,6 22,5 40,6 52,7 58,25 72,27 86,26"
        fill="none"
        strokeWidth="1.5"
        className="stroke-alert"
      />
      <polyline
        points="86,26 98,12 108,6 120,5"
        fill="none"
        strokeWidth="1.5"
        strokeDasharray="60"
        strokeDashoffset={resolved ? 0 : 60}
        className="stroke-signal transition-[stroke-dashoffset] duration-1000"
      />
    </svg>
  );
}

export function HeroConsole() {
  const [run, setRun] = useState<Run>({ started: false, t: 0, auto: true });
  const [anchors, setAnchors] = useState<LoopAnchors | null>(null);
  const [rects, setRects] = useState<Partial<Record<CardKey, Rect>>>({});
  const [hovered, setHovered] = useState<CardKey | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);
  const deliverRef = useRef<HTMLDivElement>(null);

  // One clock drives the story: idle time while broken (auto-starts), then the resolution.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => setRun({ started: true, t: CLOSED_AT, auto: false }), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setInterval(() => {
      setRun((r) => {
        if (r.started && r.t >= CLOSED_AT) return r;
        if (!r.started && !r.auto) return r;
        if (!r.started && r.t + TICK_MS >= AUTO_START) return { ...r, started: true, t: 0 };
        return { ...r, t: r.t + TICK_MS };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Card positions within the stage, for the leader lines (offset* ignores the entry transform).
  const measure = useCallback(() => {
    const read = (el: HTMLDivElement | null): Rect | undefined =>
      el ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : undefined;
    setRects({ alert: read(alertRef.current), agent: read(agentRef.current), deliver: read(deliverRef.current) });
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(measure);
    for (const el of [stageRef.current, alertRef.current, agentRef.current, deliverRef.current]) {
      if (el) ro.observe(el);
    }
    return () => ro.disconnect();
  }, [measure]);

  const resolve = () => setRun({ started: true, t: 0, auto: false });
  const breakAgain = () => setRun({ started: false, t: 0, auto: false });

  const { started, t } = run;
  const closed = started && t >= CLOSED_AT;
  const progress = started ? Math.min(1, t / CLOSED_AT) : 0;
  const agentDone = started ? AGENT_STEPS.filter((s) => t >= s).length : 0;
  const showDeliver = started && t >= DELIVER_AT;
  const delivered = started ? DELIVER_STEPS.filter((s) => t >= s).length : 0;
  const phase = !started ? 0 : closed ? 3 : t >= DELIVER_AT ? 2 : 1;

  const leaders: { key: CardKey; from?: Point; show: boolean; tone: "alert" | "signal" }[] = [
    { key: "alert", from: anchors?.gap, show: true, tone: closed ? "signal" : "alert" },
    { key: "agent", from: anchors?.ops, show: started, tone: "signal" },
    { key: "deliver", from: anchors?.plan, show: showDeliver, tone: "signal" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="label-mono flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-signal" : "animate-pulse bg-alert")}
          />
          Live incident<span className="max-sm:hidden"> · INC0012345</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-foreground">
          {clock(progress)}
        </span>
      </div>

      {/* Stage: on phones one card at a time shares a slot under the loop; from sm up they sit around it */}
      <div
        ref={stageRef}
        className="relative flex flex-col gap-3 p-4 sm:block sm:h-[680px] sm:p-0"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="sm:absolute sm:left-5 sm:top-5 sm:z-10 sm:max-w-[230px]">
          <div className="label-mono text-signal">Your incident loop</div>
          <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
            {!started ? (
              <>
                A customer&apos;s broadband just went dark.{" "}
                <span className="text-foreground">
                  <span className="sm:hidden">Tap</span>
                  <span className="max-sm:hidden">Click</span> the gap
                </span>{" "}
                to let SREnity close the loop.
              </>
            ) : closed ? (
              <>Loop closed. The next shift starts with the full story, every line cited.</>
            ) : (
              <>SREnity is reading the incident and piecing the story together…</>
            )}
          </p>
          {closed && (
            <button
              onClick={breakAgain}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/25 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/60"
            >
              <RotateCcw className="h-3 w-3" /> Break it again
            </button>
          )}
        </div>

        <div className="relative h-[220px] sm:absolute sm:inset-0 sm:h-auto">
          <HeroLoop
            progress={progress}
            onAnchors={setAnchors}
            className="absolute inset-0 h-full w-full"
          />

          {/* The gap is the call to action */}
          {anchors && !started && (
            <button
              onClick={resolve}
              aria-label="Resolve the incident with SREnity"
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: anchors.gap.x, top: anchors.gap.y + 6 }}
            >
              <span className="absolute inset-0 animate-ping rounded-full border border-alert/60" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-alert bg-background/80 transition-transform group-hover:scale-110">
                <span className="h-2 w-2 rounded-full bg-alert" />
              </span>
              <span className="tone-light absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg transition-transform group-hover:-translate-x-0.5">
                Resolve with SREnity →
              </span>
            </button>
          )}
        </div>

        {/* Leader lines from each card to its point on the loop */}
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block" aria-hidden>
          {leaders.map(({ key, from, show, tone }) => {
            const rect = rects[key];
            if (!from || !rect) return null;
            const to = nearestOnRect(from, rect);
            return (
              <g
                key={key}
                className={cn(
                  "transition-opacity duration-500",
                  show ? "opacity-100" : "opacity-0",
                  tone === "alert" ? "stroke-alert fill-alert" : "stroke-signal fill-signal",
                )}
              >
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  strokeWidth={hovered === key ? 2 : 1.25}
                  strokeDasharray="4 4"
                />
                <circle cx={from.x} cy={from.y} r={3.5} />
              </g>
            );
          })}
        </svg>

        {/* One grid cell on phones, so the slot keeps the tallest card's height and nothing jumps. */}
        <div className="grid sm:contents">
          <Card
            show
            current={!started}
            cardRef={alertRef}
            onHover={(on) => setHovered(on ? "alert" : null)}
            className="sm:right-5 sm:top-5 sm:w-[248px] sm:p-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="label-mono text-muted-foreground">Incident ticket</span>
              <span
                className={cn(
                  "label-mono rounded px-1.5 py-0.5 transition-colors duration-500",
                  closed ? "bg-signal-soft text-signal" : "bg-alert-soft text-alert",
                )}
              >
                {closed ? "Resolved" : "P2 · In progress"}
              </span>
            </div>
            <div className="mt-2 font-mono text-xs text-muted-foreground">
              INC0012345 · ROUTER-BLR-0042
            </div>
            <p className="mt-1 text-sm leading-snug sm:text-[13px]">
              Broadband service down due to failed CPE/router hardware
            </p>
            <div className="mt-2 flex items-end gap-3">
              <dl className="grid shrink-0 grid-cols-[auto_auto] gap-x-2 gap-y-0.5 text-[11px] leading-tight">
                {(closed ? RESOLVED_FIELDS : INCIDENT_FIELDS).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <Connectivity resolved={closed} />
            </div>
          </Card>

          <Card
            show={started}
            current={started && !showDeliver}
            cardRef={agentRef}
            onHover={(on) => setHovered(on ? "agent" : null)}
            className="sm:bottom-5 sm:right-5 sm:w-[264px]"
          >
            <div className="flex items-center gap-2">
              <SREnityMark className="h-4 w-auto" />
              <span className="text-sm font-medium">
                {agentDone === AGENT_LINES.length ? "Context ready" : "Reading the incident…"}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {AGENT_LINES.map((line, i) => (
                <li
                  key={line}
                  className={cn(
                    "flex gap-2 text-xs leading-snug transition-opacity duration-300",
                    i > agentDone && "opacity-40",
                  )}
                >
                  <Tick done={i < agentDone} active={i === agentDone} />
                  <span>{keepIds(line)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            show={showDeliver}
            current={showDeliver}
            cardRef={deliverRef}
            onHover={(on) => setHovered(on ? "deliver" : null)}
            className="sm:bottom-5 sm:left-5 sm:w-[240px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ready for the next shift</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {delivered}/{DELIVERABLES.length + 1}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {DELIVERABLES.map((item, i) => (
                <li
                  key={item}
                  className={cn(
                    "flex items-center gap-2 text-xs transition-opacity duration-300",
                    i >= delivered && "opacity-40",
                  )}
                >
                  <Tick done={i < delivered} active={i === delivered} />
                  {item}
                </li>
              ))}
              <li
                className={cn(
                  "flex items-center gap-2 border-t border-border pt-2 text-xs transition-opacity duration-300",
                  delivered < DELIVERABLES.length + 1 && "opacity-40",
                )}
              >
                <Tick
                  done={delivered > DELIVERABLES.length}
                  active={delivered === DELIVERABLES.length}
                />
                <span className="flex-1">Every line linked to its source</span>
                <span className="label-mono text-signal">Cited</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="border-t border-border px-4 py-3">
        <div className="h-0.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-signal transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-2.5 grid grid-cols-4">
          {PHASES.map((label, i) => (
            <span
              key={label}
              className={cn(
                "label-mono transition-colors",
                i === phase
                  ? closed
                    ? "text-signal"
                    : "text-foreground"
                  : "text-muted-foreground/60 max-sm:invisible",
                i === 3 && "text-right",
                (i === 1 || i === 2) && "text-center",
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
