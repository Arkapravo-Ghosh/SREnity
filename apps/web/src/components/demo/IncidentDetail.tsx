"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, RotateCw, Check, ChevronDown, Database, FileSearch, History, Workflow } from "lucide-react";
import { ApiError, fetchIncident } from "@/lib/demoClient";
import type { IncidentDetail as Incident } from "@/lib/servicenow/incidents";
import { cn } from "@/lib/utils";
import type { IncidentTimeline as Timeline } from "@/lib/servicenow/timeline";
import { choiceLabel, formatOpened, isClosed, priorityLabel } from "./presentation";
import { IncidentHistory } from "./IncidentHistory";
import { IncidentTimeline } from "./IncidentTimeline";

/** The analysis pane: what happened on this ticket, and what similar past tickets teach about it. */
const TABS = [
  { key: "timeline", label: "Timeline", short: "Timeline", icon: Workflow },
  { key: "history", label: "Historical analysis", short: "History", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function IncidentDetail({ sysId }: { sysId: string }) {
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("timeline");
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [historyOpened, setHistoryOpened] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchIncident(sysId)
      .then(({ incident: record }) => {
        if (!cancelled) setIncident(record);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 401) {
          router.replace("/demo/connections?provider=servicenow");
          return;
        }
        setError(cause instanceof ApiError ? cause.message : "Couldn't load that incident.");
      });
    return () => {
      cancelled = true;
    };
  }, [router, sysId, attempt]);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card/60 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
          <div>
            <p className="text-sm text-foreground">{error}</p>
            <button type="button" onClick={() => { setError(null); setAttempt((n) => n + 1); }}
              className="mr-2 mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30">
              <RotateCw className="h-3 w-3" /> Retry
            </button>
            <Link
              href="/demo"
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <ArrowLeft className="h-3 w-3" /> Back to incidents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="grid animate-pulse gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="h-96 rounded-lg border border-border bg-card/40" />
        <div className="h-96 rounded-lg border border-border bg-card/40" />
      </div>
    );
  }

  const closed = isClosed(incident.stateCode);

  const fields: [string, string][] = [
    ["Category", choiceLabel(incident.category)],
    ["Service", incident.businessService],
    ["CI", incident.cmdbCi],
    ["Group", incident.assignmentGroup],
    ["Impact", incident.impact],
    ["Urgency", incident.urgency],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left: what ServiceNow actually holds for this incident. */}
        <div className="border-b border-border bg-background/60 p-3 sm:p-5 lg:border-b-0 lg:border-r">
          <Link
            href="/demo"
            className="mb-3 inline-flex py-1 sm:mb-4 items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> All incidents
          </Link>

          <div className="rounded-md border border-border bg-card p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-foreground">{incident.number}</span>
              <span
                className={cn(
                  "label-mono inline-flex items-center gap-1.5 rounded px-2 py-1",
                  closed ? "bg-signal-soft text-signal" : "bg-alert-soft text-alert",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-signal" : "bg-alert")} />
                {incident.state || (closed ? "Closed" : "Open")} · {priorityLabel(incident.priority)}
              </span>
            </div>

            <p className="mt-2.5 text-sm leading-snug text-foreground">{incident.shortDescription}</p>

            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              Opened {formatOpened(incident.openedAt)}
              {incident.responderCount > 0 &&
                ` · ${incident.responderCount} ${incident.responderCount === 1 ? "responder" : "responders"}`}
            </p>

            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t lg:grid-cols-[auto_minmax(0,1fr)] border-border pt-3 text-[11px] leading-snug">
              {fields.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  {/* An empty field stays visibly empty: the product's claim is that it says what
                      it doesn't know rather than filling the gap. */}
                  <dd className={cn("break-words", value ? "text-foreground" : "text-muted-foreground/60")}>
                    {value || "Not set"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {incident.description && (
            <div className="mt-4">
              <div className="label-mono mb-1.5 text-muted-foreground">Description</div>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                {incident.description}
              </p>
            </div>
          )}

          <PipelinePreview
            workNoteCount={incident.workNoteCount}
            responderCount={incident.responderCount}
            timeline={timeline}
          />
        </div>

        {/* Right: the analysis tabs. */}
        <div className="p-3 sm:p-6 lg:min-h-[520px]">
          <div className="-mx-3 mb-4 flex gap-4 overflow-x-auto border-b border-border px-3 [scrollbar-width:none] sm:mx-0 sm:mb-6 sm:gap-6 sm:px-0">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                onClick={() => {
                  setTab(entry.key);
                  if (entry.key === "history") setHistoryOpened(true);
                }}
                aria-current={tab === entry.key ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 pt-1 pb-3 text-sm transition-colors",
                  tab === entry.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <entry.icon className="h-3.5 w-3.5" />
                <span className="sm:hidden">{entry.short}</span>
                <span className="hidden sm:inline">{entry.label}</span>
              </button>
            ))}
          </div>

          {/* Kept mounted so switching tabs doesn't re-read every source. */}
          <div className={tab === "timeline" ? "" : "hidden"}>
            <IncidentTimeline sysId={sysId} onLoaded={setTimeline} />
          </div>
          {/* Loaded on first open, then kept mounted like the timeline. */}
          {(tab === "history" || historyOpened) && (
            <div className={tab === "history" ? "" : "hidden"}>
              <IncidentHistory sysId={sysId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The analysis steps. Completed steps show what was actually read; the rest stay pending until built. */
type Step = { icon: typeof Database; label: string; detail: string; done: boolean };

function PipelinePreview({ workNoteCount, responderCount, timeline }: { workNoteCount: number; responderCount: number; timeline: Timeline | null }) {
  // On phones the full checklist pushed the timeline a screen and a half down, so it starts folded.
  const [expanded, setExpanded] = useState(false);
  const journal = timeline?.evidence.find((s) => s.kind === "journal");
  const audit = timeline?.evidence.find((s) => s.kind === "audit");
  const alerts = timeline?.evidence.filter((s) => s.kind === "alerts" && s.status === "ok") ?? [];
  const alertSeries = alerts.reduce((n, s) => n + s.records.length, 0);
  const steps: Step[] = [
    { icon: Database, label: "Connected to your ITSM", done: true,
      detail: `${workNoteCount} work ${workNoteCount === 1 ? "note" : "notes"} · ${responderCount} ${responderCount === 1 ? "responder" : "responders"}` },
    { icon: FileSearch, label: "Reading work notes & field history", done: !!timeline,
      detail: timeline ? `${journal?.records.length ?? 0} journal entries · ${audit?.status === "ok" ? `${audit.records.length} field changes` : "field history unavailable"}` : "reading…" },
    { icon: Workflow, label: "Correlating telemetry", done: !!timeline,
      detail: timeline ? (alerts.length ? `${alertSeries} Prometheus alert series in window` : "no monitoring source connected") : "reading…" },
    { icon: Workflow, label: "Building the incident timeline", done: !!timeline,
      detail: timeline ? `${timeline.events.length} events · each cited to its source` : "pending" },
  ];
  const done = steps.filter((step) => step.done).length;
  return (
    <div className="mt-3 sm:mt-5">
    <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="analysis-steps"
      className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left lg:hidden">
      <span className="relative grid size-5 shrink-0 place-items-center rounded-full border border-signal bg-signal text-white">
        <Check className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-tight text-foreground">Analysis progress</span>
        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{done} of {steps.length} steps complete</span>
      </span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
    </button>
    <ol id="analysis-steps" className={cn("max-lg:mt-1", !expanded && "max-lg:hidden")}>
      {steps.map((step) => (
        <li key={step.label} className={cn("flex items-start gap-3 border-b border-border py-2.5 last:border-b-0", !step.done && "opacity-45")}>
          <span className={cn("mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            step.done ? "border-signal bg-signal text-white" : "border-border")}>
            {step.done ? <Check className="h-3 w-3" /> : <step.icon className="h-2.5 w-2.5 text-muted-foreground" />}
          </span>
          <div className="min-w-0">
            <div className="text-[13px] leading-tight text-foreground">{step.label}</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{step.detail}</div>
          </div>
        </li>
      ))}
    </ol>
    </div>
  );
}
