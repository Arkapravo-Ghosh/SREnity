"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroLoop } from "./HeroLoop";
import { AGENT_LINES, DELIVERABLES, Tick, clock, keepIds } from "./HeroConsole";

/*
 * Phones' version of the hero diagram. The same incident as <HeroConsole />, told as a short
 * timeline under a compact loop: no tap target to find and no callouts to place around the loop.
 * It plays once on its own when it scrolls into view. Every step is rendered from the start, and
 * steps still to come are only dimmed, so the card never changes height while someone is reading.
 */

const START_DELAY = 1200;
const AGENT_AT = [700, 1500, 2300];
const DRAFT_AT = 3000;
const DELIVER_AT = [3400, 3800, 4200, 4600];
const CLOSED_AT = 5300;
const TICK_MS = 100;

const STEPS = [
  { at: 0, title: "P2 raised: broadband down" },
  { at: 300, title: "SREnity reads the incident" },
  { at: DRAFT_AT, title: "Context ready for the next shift" },
  { at: CLOSED_AT, title: "Loop closed" },
];

type Run = { started: boolean; t: number };

export function HeroStory({ className }: { className?: string }) {
  const [run, setRun] = useState<Run>({ started: false, t: 0 });
  const rootRef = useRef<HTMLDivElement>(null);

  // Start a moment after the card is on screen, so the broken loop is seen first.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => setRun({ started: true, t: CLOSED_AT }), 0);
      return () => window.clearTimeout(id);
    }
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => setRun((r) => (r.started ? r : { started: true, t: 0 })), START_DELAY);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const playing = run.started && run.t < CLOSED_AT;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setRun((r) => ({ ...r, t: Math.min(CLOSED_AT, r.t + TICK_MS) })), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const { started, t } = run;
  const closed = started && t >= CLOSED_AT;
  const progress = started ? Math.min(1, t / CLOSED_AT) : 0;
  const agentDone = started ? AGENT_AT.filter((s) => t >= s).length : 0;
  const delivered = started ? DELIVER_AT.filter((s) => t >= s).length : 0;
  /** Index of the step in progress; the last step counts as done once the loop is closed. */
  const current = !started ? 0 : closed ? STEPS.length : STEPS.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);

  return (
    <div ref={rootRef} className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {/* Header + progress */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="label-mono flex items-center gap-2 text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-signal" : "animate-pulse bg-alert")} />
          Live incident · INC0012345
        </div>
        <span className="font-mono text-xs tabular-nums text-foreground">{clock(progress).slice(0, 8)}</span>
      </div>
      <div className="h-0.5 bg-border">
        <div className="h-full bg-signal transition-[width] duration-100 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* The loop: Dev on the left, Ops on the right, broken where the incident is */}
      <div
        className="relative h-[150px] border-b border-border"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <HeroLoop progress={progress} className="absolute inset-0 h-full w-full" />
        <span className="label-mono absolute bottom-2.5 left-4 text-[10px] text-muted-foreground">Dev</span>
        <span className="label-mono absolute bottom-2.5 right-4 text-[10px] text-muted-foreground">Ops</span>
        <span
          className={cn(
            "label-mono absolute right-3 top-3 rounded px-1.5 py-0.5 text-[10px] transition-colors duration-500",
            closed ? "bg-signal-soft text-signal" : "bg-alert-soft text-alert",
          )}
        >
          {closed ? "Loop closed" : started ? "Closing the gap…" : "Gap in Ops"}
        </span>
      </div>

      {/* The story */}
      <ol className="px-4 pt-4 pb-3">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === STEPS.length - 1;
          return (
            <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
              {/* Rail */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors duration-500",
                    i === 0 && !closed
                      ? "border-alert bg-alert"
                      : done
                        ? "border-signal bg-signal"
                        : active
                          ? "animate-pulse border-signal"
                          : "border-border",
                  )}
                />
                {!last && <span className={cn("mt-1 w-px flex-1 transition-colors duration-500", done ? "bg-signal/60" : "bg-border")} />}
              </div>

              <div className={cn("min-w-0 transition-opacity duration-500", !last && "pb-4", !done && !active && "opacity-40")}>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground">{clock(step.at / CLOSED_AT).slice(0, 5)}</span>
                  <span className="text-sm font-medium leading-snug text-foreground">{step.title}</span>
                </div>

                {i === 0 && (
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    Failed CPE/router hardware · {keepIds("ROUTER-BLR-0042")} · Impact 1 – High
                  </p>
                )}

                {i === 1 && (
                  <ul className="mt-2 space-y-1.5">
                    {AGENT_LINES.map((line, j) => (
                      <li key={line} className={cn("flex gap-2 text-xs leading-snug text-foreground", j > agentDone && "opacity-50")}>
                        <Tick done={j < agentDone} active={active && j === agentDone} />
                        <span>{keepIds(line)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {i === 2 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DELIVERABLES.map((item, j) => {
                      const ready = j < delivered;
                      return (
                        <span
                          key={item}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors duration-300",
                            ready ? "border-signal/50 bg-signal-soft text-signal" : "border-border text-muted-foreground",
                          )}
                        >
                          {ready && <Check className="h-3 w-3" strokeWidth={3} />}
                          {item}
                        </span>
                      );
                    })}
                  </div>
                )}

                {last && (
                  <div className="mt-1 flex min-h-7 items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Every line <span className="label-mono text-signal">cited</span> to its source
                    </span>
                    {closed && (
                      <button
                        onClick={() => setRun({ started: true, t: 0 })}
                        className="pop-in inline-flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/25 px-3 py-1.5 text-xs font-medium text-foreground"
                      >
                        <RotateCcw className="h-3 w-3" /> Replay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
