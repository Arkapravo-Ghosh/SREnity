"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Check, ChevronDown, Gauge, Hash, History, Layers, MessageSquare, RefreshCw, Ticket } from "lucide-react";
import { ApiError, fetchContext, fetchTimeline } from "@/lib/demoClient";
import type { IncidentContext as Context } from "@/lib/ai/types";
import { IncidentContext } from "./IncidentContext";
import type { EvidenceSource, IncidentTimeline as Timeline, TimelineEvent } from "@/lib/servicenow/timeline";
import { cn } from "@/lib/utils";

const BADGE: Record<TimelineEvent["kind"], string> = {
  ticket: "ITSM · Ticket",
  work_note: "ITSM · Work note",
  comment: "ITSM · Comment",
  state: "ITSM · State",
  handover: "ITSM · Handover",
  field_change: "ITSM · Field",
  alert_pending: "Monitoring · Pending",
  alert_firing: "Monitoring · Alert",
  alert_resolved: "Monitoring · Recovery",
};

const SOURCE_ICON: Record<EvidenceSource["kind"], typeof Ticket> = {
  incident: Ticket,
  journal: MessageSquare,
  audit: History,
  alerts: Activity,
  sla: Gauge,
  neighbours: Layers,
  chat: Hash,
};

/** Events that share a second, kind and title (e.g. three probes failing together) read as one line. */
type Group = { key: string; at: string; kind: TimelineEvent["kind"]; title: string; events: TimelineEvent[] };

function group(events: TimelineEvent[]): Group[] {
  const groups: Group[] = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last && last.at === event.at.slice(0, 19) && last.kind === event.kind && last.title === event.title) {
      last.events.push(event);
    } else {
      groups.push({ key: event.id, at: event.at.slice(0, 19), kind: event.kind, title: event.title, events: [event] });
    }
  }
  return groups;
}

function clock(iso: string, withDate: boolean) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return withDate ? `${date.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} ${time}` : time;
}

export function IncidentTimeline({ sysId, onLoaded }: { sysId: string; onLoaded?: (timeline: Timeline) => void }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [context, setContext] = useState<Context | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextRun, setContextRun] = useState({ n: 0, refresh: false });
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchContext(sysId, contextRun.refresh)
      .then((result) => {
        if (cancelled) return;
        setContext(result);
        setContextError(null);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setContextError(cause instanceof ApiError ? cause.message : "Couldn't build the incident context.");
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sysId, contextRun]);

  const rebuild = () => {
    setContextLoading(true);
    setContextRun((run) => ({ n: run.n + 1, refresh: true }));
  };
  const contextView = (
    <IncidentContext context={context} timeline={timeline} loading={contextLoading} error={contextError} onRefresh={rebuild} />
  );

  useEffect(() => {
    let cancelled = false;
    fetchTimeline(sysId)
      .then((result) => {
        if (cancelled) return;
        setTimeline(result);
        setError(null);
        onLoaded?.(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ApiError ? cause.message : "Couldn't assemble the timeline.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onLoaded is a notification hook; re-fetching when its identity changes would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sysId, reload]);

  const refresh = () => {
    setLoading(true);
    setReload((n) => n + 1);
  };

  const groups = useMemo(() => group(timeline?.events ?? []), [timeline]);
  const sources = useMemo(() => new Map((timeline?.evidence ?? []).map((s) => [s.id, s])), [timeline]);
  const multiDay = useMemo(() => {
    const days = new Set((timeline?.events ?? []).map((e) => new Date(e.at).toDateString()));
    return days.size > 1;
  }, [timeline]);
  const zone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  if (error && !timeline) {
    return (
      <>{contextView}<div className="flex items-start gap-3 border-l-2 border-alert bg-alert-soft px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
        <div className="text-sm text-foreground">
          {error}
          <button onClick={refresh} className="ml-3 underline underline-offset-2">
            Try again
          </button>
        </div>
      </div></>
    );
  }

  if (!timeline) {
    return (
      <div className="space-y-3">{contextView}
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-12 animate-pulse rounded bg-background/60" />
        ))}
        <p className="font-mono text-[11px] text-muted-foreground">Reading the ticket, work notes, field history and telemetry…</p>
      </div>
    );
  }

  const usable = timeline.evidence.filter((s) => s.status === "ok");
  const allOk = usable.length === timeline.evidence.length;

  return (
    <div className="pop-in">
      {contextView}
      <div className="mb-4 flex items-start justify-between gap-3">
        <button onClick={() => setShowRaw(!showRaw)} aria-expanded={showRaw}
          className="min-w-0 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("h-3 w-3 transition", showRaw && "rotate-180")} />
          {showRaw ? "Hide" : "Show"} all {timeline.events.length} raw events · times in {zone}<span className="hidden sm:inline"></span>
        </button>
        <button
          onClick={refresh}
          disabled={loading}
          className="-my-1 -mr-2 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground active:bg-background/60 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {showRaw && <ol className="relative">
        {groups.map((g, index) => {
          const first = g.events[0];
          const expanded = open === g.key;
          const last = index === groups.length - 1;
          return (
            <li key={g.key} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-x-3 pb-4 sm:grid-cols-[14px_auto_minmax(0,1fr)] sm:pb-5">
              {!last && <span className="absolute left-[6px] top-4 h-full w-px bg-border" aria-hidden />}
              <span
                className={cn(
                  "relative mt-1.5 h-3 w-3 rounded-full border-2",
                  g.kind === "alert_firing"
                    ? "border-alert bg-alert"
                    : g.kind === "alert_resolved"
                      ? "border-signal bg-signal"
                      : g.kind === "ticket" || g.kind === "handover" || g.kind === "state"
                        ? "border-signal bg-card"
                        : "border-border bg-card",
                )}
              />
              <span className="mt-0.5 hidden font-mono text-[12px] tabular-nums text-muted-foreground sm:block">{clock(first.at, multiDay)}</span>
              <div className="min-w-0">
                <button onClick={() => setOpen(expanded ? null : g.key)} className="group w-full text-left" aria-expanded={expanded}>
                  <span className="mb-0.5 flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-muted-foreground sm:hidden">
                    {clock(first.at, multiDay)}
                    <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium leading-snug text-foreground sm:text-[15px]">
                      {g.title}
                      {g.events.length > 1 && <span className="text-muted-foreground"> ×{g.events.length}</span>}
                    </span>
                    <span className="label-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {BADGE[g.kind]}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn("hidden h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 sm:block", expanded && "rotate-180 opacity-100")}
                    />
                  </div>
                  {g.events.map((event) =>
                    event.detail ? (
                      <p key={event.id} className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                        {event.detail}
                      </p>
                    ) : null,
                  )}
                  {first.actor && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">by {first.actor}</p>}
                </button>

                {expanded && (
                  <div className="mt-2 space-y-2">
                    {g.events.map((event) => {
                      const source = sources.get(event.evidence.source);
                      const record = source?.records.find((r) => r.id === event.evidence.record);
                      return (
                        <div key={event.id} className="rounded border border-border bg-background/70 p-3">
                          <div className="label-mono text-[10px] text-muted-foreground">Evidence · {source?.label}</div>
                          <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{source?.location}</div>
                          {source?.query && (
                            <div className="mt-1 break-all font-mono text-[11px] text-foreground/80">{source.query}</div>
                          )}
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-card p-2 font-mono text-[11px] leading-relaxed text-foreground">
                            {JSON.stringify({ record: event.evidence.record, ...(record?.raw ?? {}) }, null, 2)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>}

      <EvidencePanel timeline={timeline} allOk={allOk} />
    </div>
  );
}

function sourceSummary(source: EvidenceSource): string {
  const n = source.records.length;
  switch (source.kind) {
    case "incident":
      return source.records[0]?.summary ?? "Ticket record";
    case "journal": {
      const notes = source.records.filter((r) => r.raw.element === "work_notes").length;
      const authors = new Set(source.records.map((r) => String(r.raw.sys_created_by ?? ""))).size;
      return `${notes} work ${notes === 1 ? "note" : "notes"} · ${n - notes} ${n - notes === 1 ? "comment" : "comments"} · ${authors} ${authors === 1 ? "author" : "authors"}`;
    }
    case "audit":
      return n ? `${n} field ${n === 1 ? "change" : "changes"} (state, priority, assignment)` : "No state or assignment changes since opening";
    case "alerts":
      return `${n} alert ${n === 1 ? "series" : "series"} in window · ${source.linkedAlerts ?? 0} on the incident CI`;
    case "sla":
      return n ? source.records.map((r) => r.summary).join(" · ") : source.message || "No SLA attached";
    case "neighbours":
      return n ? `${n} other ${n === 1 ? "incident" : "incidents"} open in the same window` : "No other incidents open in this window";
    case "chat": {
      const people = new Set(source.records.map((r) => String(r.raw.user_name ?? ""))).size;
      return `${n} ${n === 1 ? "message" : "messages"} in window · ${people} ${people === 1 ? "person" : "people"}`;
    }
  }
}

function EvidencePanel({ timeline, allOk }: { timeline: Timeline; allOk: boolean }) {
  const [openSource, setOpenSource] = useState<string | null>(null);
  const shown = timeline.evidence.find((s) => s.id === openSource);
  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/60 px-4 py-3">
        <span className="label-mono text-muted-foreground">Evidence read<span className="hidden sm:inline"> · {timeline.incident.number}</span></span>
        <span className={cn("label-mono inline-flex items-center gap-1.5", allOk ? "text-signal" : "text-alert")}>
          {allOk ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {timeline.evidence.filter((s) => s.status === "ok").length} of {timeline.evidence.length} sources<span className="hidden sm:inline"> · every line cited</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border lg:bg-transparent [&>*:last-child:nth-child(odd)]:max-lg:col-span-2">
        {timeline.evidence.map((source) => {
          const Icon = SOURCE_ICON[source.kind];
          return (
            <button
              key={source.id}
              onClick={() => setOpenSource(openSource === source.id ? null : source.id)}
              aria-expanded={openSource === source.id}
              className={cn("flex flex-col bg-card p-3 text-left transition-colors hover:bg-background sm:p-4 lg:bg-transparent lg:hover:bg-background/60", openSource === source.id && "bg-background lg:bg-background/60")}
            >
              <div className="flex items-start gap-2 text-[13px] font-medium leading-snug text-foreground sm:text-[14px]">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                {source.label.replace(/^Prometheus alerts · /, "Prometheus · ")}
              </div>
              <p className={cn("mt-1.5 text-[12px] leading-snug", source.status === "ok" ? "text-muted-foreground" : "text-alert")}>
                {source.status === "ok" ? sourceSummary(source) : source.message}
              </p>
              <p className="label-mono mt-2 text-[10px] text-muted-foreground/80 sm:mt-3">
                {source.system === "servicenow" ? "ITSM · ServiceNow" : source.system === "slack" ? "Chat · Slack" : "Monitoring · Prometheus"}
              </p>
            </button>
          );
        })}
      </div>
      {shown && (
        <div className="border-t border-border bg-background/60 px-4 py-3">
          <div className="break-all font-mono text-[11px] text-muted-foreground">{shown.location}</div>
          {shown.query && <div className="mt-1 break-all font-mono text-[11px] text-foreground/80">{shown.query}</div>}
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            read {new Date(shown.fetchedAt).toLocaleTimeString()} · {shown.records.length} records
          </div>
        </div>
      )}

    </section>
  );
}
