"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Clock, FileText, History, Lightbulb, RotateCcw, Wrench } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { DEMO_INCIDENTS, type DemoIncident } from "./demoIncidents";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Phase = "idle" | "running" | "done";

/** The product's views: this incident's story, what similar incidents teach, and the review report. */
const TABS = [
  { key: "timeline", label: "Timeline", short: "Timeline", icon: Clock },
  { key: "history", label: "Historical analysis", short: "History", icon: History },
  { key: "pir", label: "PIR report", short: "PIR", icon: FileText },
] as const;

function WindowChrome({ phase, id }: { phase: Phase; id: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          srenity / incidents / <span className="text-foreground">{id}</span>
        </span>
      </div>
      <span className="label-mono hidden text-muted-foreground sm:inline">
        {phase === "done" ? "Analysis complete" : phase === "running" ? "Analyzing" : "Ready"}
      </span>
    </div>
  );
}

function BlockLabel({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "signal" | "alert" }) {
  return (
    <div
      className={cn(
        "label-mono mb-2",
        tone === "signal" ? "text-signal" : tone === "alert" ? "text-alert" : "text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

function SourceChip({ source, className }: { source: string; className?: string }) {
  return (
    <span className={cn("label-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground", className)}>
      {source}
    </span>
  );
}

const VERDICT = {
  worked: { label: "Worked", tone: "border-signal/40 bg-signal-soft text-signal" },
  did_not_work: { label: "Did not work", tone: "border-alert/40 bg-alert-soft text-alert" },
  disputed: { label: "Monitoring disagrees", tone: "border-alert/40 bg-alert-soft text-alert" },
} as const;

function Bullets({ items }: { items: { text: string; source?: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.text} className="flex gap-2 text-[14px] leading-snug text-foreground">
          <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
          <span>
            {item.text}
            {item.source && <SourceChip source={item.source} className="ml-1.5 align-middle" />}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TimelinePanel({ incident }: { incident: DemoIncident }) {
  return (
    <div className="stagger space-y-6">
      <div>
        <BlockLabel tone="signal">Incident context</BlockLabel>
        <Bullets items={incident.context} />
        <div className="mt-3 grid grid-cols-2 border-y border-border sm:grid-cols-4">
          {incident.timing.map((s, i) => (
            <div
              key={s.label}
              className={cn("py-3 pr-3", i > 0 && "sm:border-l sm:border-border sm:pl-4", i % 2 === 1 && "border-l border-border pl-4")}
            >
              <div className="font-display text-xl text-foreground">{s.value}</div>
              <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <BlockLabel>Already tried</BlockLabel>
        <ul className="space-y-3">
          {incident.tried.map((a) => (
            <li key={a.time + a.action} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3">
              <span className="pt-0.5 font-mono text-xs text-muted-foreground">{a.time}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{a.action}</span>
                  <span className={cn("label-mono rounded border px-1.5 py-0.5 text-[10px]", VERDICT[a.verdict].tone)}>
                    {VERDICT[a.verdict].label}
                  </span>
                  <SourceChip source={a.source} />
                </div>
                <p className={cn("mt-0.5 text-xs", a.verdict === "disputed" ? "text-alert" : "text-muted-foreground")}>{a.outcome}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <BlockLabel>What happened</BlockLabel>
        <div className="relative pl-6">
          <div className="timeline-spine absolute bottom-2 left-[5px] top-2 w-px bg-border" />
          {incident.events.map((e, i) => (
            <div key={e.time} className="pop-in relative mb-4 last:mb-0 sm:mb-5" style={{ animationDelay: `${i * 70}ms` }}>
              <span
                className={cn(
                  "absolute -left-6 top-[5px] h-[11px] w-[11px] rounded-full border-2 bg-card",
                  e.tone === "alert"
                    ? "border-alert bg-alert"
                    : e.tone === "signal"
                      ? "border-signal"
                      : e.tone === "done"
                        ? "border-signal bg-signal"
                        : "border-border",
                )}
              />
              {/* Every event names the record it was read from: beside the title from sm; on phones the
                chip shares the time's row and the title and detail take the full width below it. */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
                <span className="text-sm font-medium text-foreground max-sm:order-last max-sm:w-full">{e.title}</span>
                <SourceChip source={e.source} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:pl-[52px]">{e.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 border-l-2 border-alert bg-alert-soft px-3 py-2.5 text-[13px] text-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
        <span><span className="label-mono mr-1.5 text-alert">Gap flagged</span>{incident.gap}</span>
      </div>
    </div>
  );
}

function HistoryPanel({ incident }: { incident: DemoIncident }) {
  return (
    <div className="stagger space-y-6">
      <div>
        <BlockLabel tone="signal">What past incidents tell us</BlockLabel>
        <Bullets items={incident.history.takeaways.map((text) => ({ text }))} />
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {incident.history.matches.map((m) => (
          <li key={m.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                <span className="font-mono">{m.id}</span> · {m.title}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">resolved {m.resolved} · took {m.took}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {m.matchedBy.map((r) => <SourceChip key={r} source={r} />)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{m.why}</p>
            <div className="mt-2.5 grid gap-1 text-[13px] sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
              <span className="label-mono flex items-center gap-1.5 text-muted-foreground"><Wrench className="h-3 w-3" /> How it was resolved</span>
              <span className="border-l-2 border-signal/50 pl-2 italic text-foreground">
                “{m.fix}” <SourceChip source={m.fixSource} className="ml-1 not-italic" />
              </span>
              <span className="label-mono flex items-center gap-1.5 text-muted-foreground"><Lightbulb className="h-3 w-3" /> What it means here</span>
              <span className="text-foreground">{m.lesson}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PirSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="font-display text-base text-foreground sm:text-lg">
        <span className="mr-2 font-mono text-xs text-muted-foreground">{String(n).padStart(2, "0")}</span>
        {title}
      </h4>
      <dl className="mt-3 space-y-3">{children}</dl>
    </section>
  );
}

function PirField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="label-mono text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[13px] leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}

/** A draft post-incident review in the standard PIR order. The RCA is section 3. */
function PirPanel({ incident }: { incident: DemoIncident }) {
  const pir = incident.pir;
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
        <span className="text-sm font-medium text-foreground">Post-Incident Review · {incident.id}</span>
        <span className="label-mono rounded bg-alert-soft px-2 py-1 text-[10px] text-alert">Draft · awaiting review</span>
      </div>

      <div className="max-h-105 space-y-6 overflow-y-auto bg-card px-4 py-5 sm:max-h-130 sm:space-y-8 sm:px-5">
        <PirSection n={1} title="Introduction">
          <PirField label="Incident title">{pir.title}</PirField>
          <PirField label="Date of incident">{pir.date}</PirField>
          <PirField label="Report date">{pir.reportDate}</PirField>
          <PirField label="Purpose">{pir.purpose}</PirField>
        </PirSection>

        <PirSection n={2} title="Incident summary">
          <PirField label="Incident description">{pir.description}</PirField>
          <PirField label="Impact assessment">
            {pir.impact}
            <div className="mt-3 grid grid-cols-2 border-y border-border sm:grid-cols-4">
              {incident.impact.map((s, i) => (
                <div
                  key={s.label}
                  className={cn("py-3 pr-3", i > 0 && "sm:border-l sm:border-border sm:pl-4", i % 2 === 1 && "border-l border-border pl-4")}
                >
                  <div className="font-display text-xl text-foreground">{s.value}</div>
                  <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </PirField>
        </PirSection>

        {/* The RCA report: always states its basis, stated by someone or inferred from evidence. */}
        <div className="border-l-2 border-alert bg-alert-soft px-4 py-4">
          <div className="label-mono mb-3 inline-flex items-center gap-1.5 text-alert">
            <AlertTriangle className="h-3.5 w-3.5" /> RCA report
          </div>
          <PirSection n={3} title="Root cause analysis">
            <PirField label="Root cause">
              {incident.rootCause}
              <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">Basis: {incident.rootCauseBasis}</span>
            </PirField>
            <PirField label="Contributing factors">
              <ul className="list-outside list-disc space-y-1 pl-4 marker:text-alert">
                {pir.contributing.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </PirField>
          </PirSection>
        </div>

        <PirSection n={4} title="Incident response">
          <PirField label="Initial response">{pir.initialResponse}</PirField>
          <PirField label="Mitigation measures">{pir.mitigation}</PirField>
          <PirField label="Communication">{pir.communication}</PirField>
        </PirSection>

        <PirSection n={5} title="Resolution and recovery">
          <PirField label="Resolution steps">{pir.resolution}</PirField>
          <PirField label="Recovery timeline">{pir.recovery}</PirField>
        </PirSection>

        <PirSection n={6} title="Lessons learned">
          <PirField label="Identified gaps">{pir.gaps}</PirField>
          <PirField label="Opportunities for improvement">{pir.improvements}</PirField>
        </PirSection>

        <PirSection n={7} title="Action plan">
          <PirField label="Improvement actions">
            <ol className="divide-y divide-border border-y border-border">
              {pir.actions.map((a, i) => (
                <li key={a.action} className="flex gap-3 py-2.5">
                  <span className="font-mono text-xs text-signal">{i + 1}.</span>
                  <div className="min-w-0">
                    <div>{a.action}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      Responsible: {a.owner} · Deadline: {a.due}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </PirField>
          <PirField label="Follow-up review">{pir.followUp}</PirField>
        </PirSection>

        <PirSection n={8} title="Roles and responsibilities">
          <PirField label="Incident response team">{pir.responseTeam}</PirField>
          <PirField label="PIR team">{pir.pirTeam}</PirField>
        </PirSection>

        <PirSection n={9} title="Documentation">
          <PirField label="Incident record">{pir.incidentRecord}</PirField>
          <PirField label="Evidence">{pir.evidence}</PirField>
        </PirSection>

        <PirSection n={10} title="Review and distribution">
          <PirField label="Stakeholder review">{pir.review}</PirField>
          <PirField label="Distribution list">{pir.distribution}</PirField>
        </PirSection>

        <PirSection n={11} title="Conclusion">
          <PirField label="Summary">{pir.conclusion}</PirField>
        </PirSection>
      </div>
    </div>
  );
}

/** The sources read for this incident. Every statement in the outputs cites one of them. */
function EvidenceRead({ incident }: { incident: DemoIncident }) {
  return (
    <div className="rounded-md border border-border bg-background/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="label-mono text-muted-foreground">Evidence read · {incident.id}</span>
        <span className="label-mono inline-flex items-center gap-1.5 text-signal">
          <Check className="h-3 w-3" /> {incident.evidence.length} sources · every line cited
        </span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4">
        {incident.evidence.map((e, i) => (
          <div
            key={e.label}
            className={cn(
              "px-3 py-3 sm:px-4",
              i % 2 === 1 && "border-l border-border",
              i >= 2 && "border-t border-border xl:border-t-0",
              i === 2 && "xl:border-l",
            )}
          >
            <div className="flex items-center gap-2">
              <e.icon className="h-3.5 w-3.5 shrink-0 text-signal" />
              <span className="text-[13px] text-foreground">{e.label}</span>
            </div>
            <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{e.value}</div>
            <div className="label-mono mt-2 text-[9.5px] text-muted-foreground/80">{e.system}</div>
          </div>
        ))}
      </div>
      <p className="border-t border-border px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Every statement above links back to one of these records. Where evidence is missing, SREnity says
        so instead of guessing.
      </p>
    </div>
  );
}

/** While the agent works, show what it is actually doing as a run log. */
function RunLog({ phase, stage, incident }: { phase: Phase; stage: number; incident: DemoIncident }) {
  return (
    <div className="flex h-full min-h-60 flex-col rounded-md border border-border bg-background p-4 font-mono text-xs leading-6 sm:p-5 lg:min-h-105">
      <div className="text-foreground">
        <span className="text-signal">$</span> srenity analyze {incident.id} --show timeline,history,pir
      </div>
      {phase === "idle" ? (
        <div className="mt-2 text-muted-foreground">
          waiting · press <span className="text-foreground">Run analysis</span> to start
          <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-foreground/60" />
        </div>
      ) : (
        <div className="mt-2 space-y-0.5">
          {incident.stages.slice(0, stage + 1).map((s, i) => {
            const finished = i < stage;
            return (
              <div key={s.label} className="pop-in flex gap-3">
                <span className={finished ? "text-signal" : "text-muted-foreground"}>
                  {finished ? "✓" : "›"}
                </span>
                <span className={finished ? "text-foreground" : "text-muted-foreground"}>
                  {s.label.toLowerCase()}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                  {!finished && (
                    <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-foreground/60" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LiveDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState(0);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("timeline");
  const [incidentKey, setIncidentKey] = useState(DEMO_INCIDENTS[0]!.key);
  const sectionRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const incident = DEMO_INCIDENTS.find((i) => i.key === incidentKey)!;
  const stages = incident.stages;

  // Auto-run the first time the section scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setPhase("running");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Advance the pipeline one stage at a time.
  useEffect(() => {
    if (phase !== "running") return;
    if (stage < stages.length) {
      const t = setTimeout(() => setStage((s) => s + 1), stage === 0 ? 900 : 1150);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("done"), 800);
    return () => clearTimeout(t);
  }, [phase, stage, stages.length]);

  const run = () => {
    startedRef.current = true;
    setStage(0);
    setTab("timeline");
    setPhase("running");
  };

  const pick = (key: string) => {
    if (key === incidentKey) return;
    setIncidentKey(key);
    run();
    track("demo_incident", { incident: key });
  };

  const running = phase === "running" || phase === "done";

  return (
    <section id="demo" ref={sectionRef} className="relative scroll-mt-14 py-14 sm:py-20 md:scroll-mt-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading index="01" label="Live demo · simulated data" title="Watch SREnity work an incident">
          Pick a network or an application incident and see what the next person on shift gets: what
          happened, what was already tried and whether it worked, how similar incidents were fixed
          before, and the PIR report. The data is simulated; every line still points to the record it came from.
        </SectionHeading>

        <Reveal delay={150} className="mt-8 sm:mt-12">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label-mono text-muted-foreground">Pick an incident</span>
            {/* Phones: a full-width segmented control with two equal, thumb-sized halves. */}
            <div
              role="group"
              aria-label="Demo incident"
              className="grid w-full grid-cols-2 rounded-full border border-border bg-card p-1 sm:inline-flex sm:w-auto"
            >
              {DEMO_INCIDENTS.map((i) => (
                <button
                  key={i.key}
                  onClick={() => pick(i.key)}
                  aria-pressed={i.key === incidentKey}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-2.5 text-xs font-medium transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm",
                    i.key === incidentKey
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i.picker}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_24px_48px_-28px_rgba(14,26,43,0.28)]">
            <WindowChrome phase={phase} id={incident.id} />

            {/* minmax(0,…) so wide content (email headers) scrolls or truncates instead of widening the card. */}
            <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
              {/* Left: incident + pipeline */}
              <div className="border-b border-border bg-background/60 p-4 sm:p-5 lg:border-b-0 lg:border-r">
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-foreground">{incident.id}</span>
                    <span
                      className={cn(
                        "label-mono inline-flex items-center gap-1.5 rounded px-2 py-1",
                        phase === "done" ? "bg-signal-soft text-signal" : "bg-alert-soft text-alert",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          phase === "done" ? "bg-signal" : "animate-pulse bg-alert",
                        )}
                      />
                      {phase === "done" ? "Resolved" : "In progress"} · {incident.priority}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-snug text-foreground">{incident.title}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{incident.opened}</p>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] leading-snug">
                    {incident.fields.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Side by side only from lg. Stacked, the run log below already narrates these
                  steps, so the list would just push the outputs a screen further down. */}
                <ol className="mt-5 hidden lg:block">
                  {stages.map((s, i) => {
                    const done = phase === "done" || (running && i < stage);
                    const active = phase === "running" && i === stage;
                    return (
                      <li
                        key={s.label}
                        className={cn(
                          "flex items-start gap-3 border-b border-border py-2.5 transition-opacity duration-500 last:border-b-0",
                          !done && !active && "opacity-45",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                            done
                              ? "border-signal bg-signal text-white"
                              : active
                                ? "border-foreground text-foreground"
                                : "border-border text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] leading-tight text-foreground">{s.label}</div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                            {active || done ? s.detail : "pending"}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {phase === "idle" && (
                  <button
                    onClick={run}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Run analysis
                  </button>
                )}
                {phase === "running" && stage < stages.length && (
                  <div className="mt-5">
                    <div className="h-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-signal transition-[width] duration-700"
                        style={{ width: `${(stage / stages.length) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {Math.round((stage / stages.length) * 100)}% · analyzing
                    </div>
                  </div>
                )}
                {phase === "done" && (
                  <button
                    onClick={run}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
                  >
                    <RotateCcw className="h-4 w-4" /> Replay analysis
                  </button>
                )}
              </div>

              {/* Right: outputs */}
              <div className="flex flex-col p-4 sm:p-6 lg:min-h-[520px]">
                {phase !== "done" ? (
                  <RunLog phase={phase} stage={stage} incident={incident} />
                ) : (
                  <div className="flex flex-1 flex-col">
                    {/* Phones: three equal tabs that all fit, so none hides off the edge. */}
                    <div className="mb-5 grid grid-cols-3 border-b border-border sm:mb-6 sm:flex sm:gap-6 sm:overflow-x-auto">
                      {TABS.map((t) => (
                        <button
                          key={t.key}
                          aria-pressed={tab === t.key}
                          onClick={() => setTab(t.key)}
                          className={cn(
                            "-mb-px inline-flex shrink-0 items-center justify-center gap-1.5 border-b-2 pt-1 pb-3 text-[13px] transition-colors sm:justify-start sm:pt-0 sm:text-sm",
                            tab === t.key
                              ? "border-foreground text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <t.icon className="h-3.5 w-3.5 max-sm:hidden" />
                          <span className="sm:hidden">{t.short}</span>
                          <span className="max-sm:hidden">{t.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Keyed by incident too, so switching incidents replays the panel's entrance. */}
                    <div key={`${incident.key}-${tab}`} className="pop-in">
                      {tab === "timeline" && <TimelinePanel incident={incident} />}
                      {tab === "history" && <HistoryPanel incident={incident} />}
                      {tab === "pir" && <PirPanel incident={incident} />}
                    </div>
                    {/* Pinned to the bottom so short tabs end on the evidence, not on empty space. */}
                    <div className="mt-auto pt-6">
                      <EvidenceRead incident={incident} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
