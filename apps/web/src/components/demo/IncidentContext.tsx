"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, Clock, GitBranch, MessageSquare, Network, RefreshCw, SearchX, ShieldCheck, Sparkles, UserRound, Waypoints } from "lucide-react";
import type { Citation, IncidentContext as Context } from "@/lib/ai/types";
import type { IncidentTimeline as Timeline } from "@/lib/servicenow/timeline";
import { cn } from "@/lib/utils";
import { EvidenceChip } from "./EvidenceChip";
import { QuoteBlock, Quoted } from "./Quoted";

function clock(iso: string | null, withDate = false) {
  if (!iso) return "";
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return withDate ? `${date.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} ${time}` : time;
}

function range(start: string | null, end: string | null, withDate: boolean) {
  return `${clock(start, withDate)} → ${clock(end, withDate)}`;
}

/**
 * The readable layer: what happened, who owned it, what changed, where it stalled. Every line carries
 * chips that open the exact record it came from; the evidence panel below stays the source of truth.
 */
export function IncidentContext({
  context, timeline, loading, error, onRefresh,
}: { context: Context | null; timeline: Timeline | null; loading: boolean; error: string | null; onRefresh: () => void }) {
  const [openCite, setOpenCite] = useState<string | null>(null);
  const withDate = !!context && new Set([context.incident.openedAt, context.generatedAt].map((d) => new Date(d).toDateString())).size > 1;

  if (!context) {
    return (
      <section className="mb-6 rounded-lg border border-border bg-card p-5">
        <Header loading={loading} onRefresh={onRefresh} />
        {error ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-background/70" style={{ width: `${90 - n * 15}%` }} />)}
            <p className="pt-1 font-mono text-[11px] text-muted-foreground">Reading the ticket, field history, alerts and team chat, then checking every statement against its record…</p>
          </div>
        )}
      </section>
    );
  }

  const chip = (id: string) => <EvidenceChip key={id} id={id} active={openCite === id} onClick={() => setOpenCite(openCite === id ? null : id)} />;
  const chips = (ids: string[]) => <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">{ids.map(chip)}</span>;
  const owner = context.owners[context.owners.length - 1];
  const gaps = context.gaps.filter((g) => g.kind !== "source_note");

  return (
    <section className="pop-in mb-6 overflow-hidden rounded-lg border border-border bg-card">
      <div className="p-5">
        <Header loading={loading} onRefresh={onRefresh} context={context} />

        {context.summary.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-[15px] leading-snug text-foreground">
            {context.summary.map((s, n) => (
              <li key={n} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" /><span><Quoted text={s.text} />{chips(s.cites)}{s.disputed && <Disputed note={s.disputed} />}</span></li>
            ))}
          </ul>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Fact icon={<UserRound className="h-3.5 w-3.5" />} label="Owner now"
            value={owner ? `${owner.group}${owner.assignee ? " · " + owner.assignee : ""}` : "Unknown"}
            warn={!!owner && !owner.assignee} note={owner && !owner.assignee ? "No named assignee" : undefined} cites={owner?.cites ?? []} chip={chip} />
          <Fact icon={<Clock className="h-3.5 w-3.5" />} label={context.status.open ? "Status" : "Ended"}
            value={context.status.text} cites={context.states.at(-1)?.cites ?? []} chip={chip} />
          <Fact icon={<ShieldCheck className="h-3.5 w-3.5" />} label="SLA"
            value={context.sla[0]?.text.split(": ").slice(1).join(": ") || "No SLA attached"}
            warn={context.sla.some((s) => s.breached)} cites={context.sla[0]?.cites ?? []} chip={chip} />
        </div>
        <Metrics rows={metricRows(context)} chip={chip} />
      </div>

      {openCite && <CitationDetail id={openCite} context={context} timeline={timeline} onClose={() => setOpenCite(null)} chip={chip} />}

      {context.attempts.length > 0 && (
        <Block title="Already tried">
          <ol className="space-y-3">
            {context.attempts.map((a, n) => (
              <li key={n} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
                <span className="pt-0.5 font-mono text-[12px] tabular-nums text-muted-foreground">{clock(a.at, withDate)}</span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-foreground">
                    <Quoted text={a.action} />
                    <Verdict verdict={a.verdict} />
                    {chips(a.cites)}
                  </p>
                  <p className={cn("text-[13px] leading-snug", a.verdict === "contradicted" ? "text-alert" : "text-muted-foreground")}>
                    <Quoted text={a.outcome} />{a.monitoringCites.length > 0 && chips(a.monitoringCites)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {context.story.length > 0 && (
        <Block title="What happened">
          <ol className="space-y-3">
            {context.story.map((s, n) => (
              <li key={n} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
                <span className="pt-0.5 font-mono text-[12px] tabular-nums text-muted-foreground">{clock(s.at, withDate)}</span>
                <div>
                  <p className="text-[14px] font-medium text-foreground"><Quoted text={s.title} />{chips(s.cites)}{s.disputed && <Disputed note={s.disputed} />}</p>
                  <p className="text-[13px] leading-snug text-muted-foreground"><Quoted text={s.why} /></p>
                  {s.quotes.map((q, i) => (
                    <QuoteBlock key={i} text={q.text}>{chips([q.cite])}</QuoteBlock>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <ChangesBlock context={context} chips={chips} withDate={withDate} />
      <DependenciesBlock context={context} chips={chips} />
      <TracesBlock context={context} chips={chips} withDate={withDate} />

      <Block title="Who owned it">
        <ol className="space-y-1.5">
          {context.owners.map((o, n) => (
            <li key={n} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 text-[13px]">
              <span className="font-mono tabular-nums text-muted-foreground">{range(o.start, o.end, withDate)}</span>
              <span className={cn("text-foreground", !o.assignee && "text-alert")}>{o.text}{chips(o.cites)}</span>
            </li>
          ))}
        </ol>
      </Block>

      {(context.handovers.length > 0 || context.chatHandovers.length > 0) && (
        <Block title="Handovers">
          <ul className="space-y-1.5 text-[13px]">
            {context.handovers.map((h, n) => (
              <li key={`sn${n}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono tabular-nums text-muted-foreground">{clock(h.start, withDate)}</span>
                <span className="text-foreground">{h.from || "unassigned"} <ArrowRight className="inline h-3 w-3" /> {h.to || "unassigned"}</span>
                <span className="text-muted-foreground">in ServiceNow{h.by ? ` by ${h.by}` : ""}{h.confirmedInChat ? " · also announced in chat" : ""}</span>
                {chips(h.cites)}
              </li>
            ))}
            {context.chatHandovers.filter((h) => !h.confirmed).map((h, n) => (
              <li key={`chat${n}`} className="flex flex-wrap items-baseline gap-x-2 text-alert">
                <span className="font-mono tabular-nums">{clock(h.at, withDate)}</span>
                <span><Quoted text={`“${h.quote}”`} /> — {h.by} in chat; ServiceNow assignee unchanged</span>{chips(h.cites)}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {context.idleGaps.length > 0 && (
        <Block title="Where it stalled">
          <ul className="space-y-1.5 text-[13px]">
            {context.idleGaps.map((g, n) => (
              <li key={n} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3">
                <span className="font-mono tabular-nums text-muted-foreground">{range(g.start, g.end, withDate)}</span>
                <span className={g.open ? "text-alert" : "text-foreground"}>{g.text}{chips(g.cites)}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {context.openItems.length > 0 && (
        <Block title="Still open">
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-foreground">
            {context.openItems.map((o, n) => <li key={n}><Quoted text={o.text} />{chips(o.cites)}</li>)}
          </ul>
        </Block>
      )}

      <ChatBlock context={context} chips={chips} />

      {gaps.length > 0 && (
        <Block title="Gaps and flags">
          <ul className="space-y-1 text-[13px]">
            {gaps.map((g, n) => (
              <li key={n} className="flex items-start gap-2 text-foreground"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" /><span><Quoted text={g.text} />{chips(g.cites)}</span></li>
            ))}
          </ul>
        </Block>
      )}

      {context.excluded.length > 0 && (
        <Block title="Left out as noise">
          <ul className="space-y-1 text-[13px] text-muted-foreground">
            {context.excluded.map((x, n) => <li key={n}>{x.count} record{x.count === 1 ? "" : "s"}: {x.reason}{chips(x.cites.slice(0, 6))}</li>)}
          </ul>
        </Block>
      )}
    </section>
  );
}

export function SyncedAt({ at, fromSaved }: { at?: string | null; fromSaved?: boolean }) {
  if (!at) return null;
  const when = new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  return <span className="font-mono text-[11px] text-muted-foreground" title={fromSaved ? "Loaded from the saved analysis" : "Just generated and saved"}>Synced {when}</span>;
}

function Header({ loading, onRefresh, context }: { loading: boolean; onRefresh: () => void; context?: Context | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="label-mono inline-flex items-center gap-1.5 text-signal"><Sparkles className="h-3 w-3" /> Incident context</span>
      <span className="flex items-center gap-3">
        <SyncedAt at={context?.savedAt ?? context?.generatedAt} fromSaved={context?.fromSaved} />
        <button title="Re-read the incident's records and run the AI analysis again" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> {loading ? "Syncing…" : "Resync"}
        </button>
      </span>
    </div>
  );
}

const VERDICT: Record<Context["attempts"][number]["verdict"], { label: string; tone: string }> = {
  worked: { label: "Worked", tone: "border-signal/40 bg-signal-soft text-signal" },
  recovered: { label: "Recovered after", tone: "border-signal/40 bg-signal-soft text-signal" },
  did_not_work: { label: "Did not work", tone: "border-alert/40 bg-alert-soft text-alert" },
  contradicted: { label: "Did not work", tone: "border-alert/40 bg-alert-soft text-alert" },
  unclear: { label: "Result unclear", tone: "border-border text-muted-foreground" },
};

function Disputed({ note }: { note: string }) {
  return (
    <span title={note} className="label-mono ml-1.5 inline-flex items-center gap-1 rounded border border-alert/40 bg-alert-soft px-1.5 py-0.5 align-middle text-[10px] text-alert">
      <AlertTriangle className="h-2.5 w-2.5" /> Monitoring disagrees
    </span>
  );
}

function Verdict({ verdict }: { verdict: Context["attempts"][number]["verdict"] }) {
  const v = VERDICT[verdict] ?? VERDICT.unclear;
  return <span className={cn("label-mono rounded border px-1.5 py-0.5 text-[10px]", v.tone)}>{v.label}</span>;
}

type FactRow = { label: string; value: string; note?: string; warn?: boolean; cites: string[] };

function short(seconds: number) {
  const m = Math.max(0, Math.round(seconds / 60));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** Detection lag, TTR, impact window and MTTR, with a like-for-like comparison against past incidents. */
function metricRows(context: Context): FactRow[] {
  const r = context.resolution ?? {};
  const rows: FactRow[] = [];
  const d = context.detectionLag;
  const lag = d?.seconds !== undefined ? short(d.seconds) : d?.text.match(/fired (.+?) before/)?.[1];
  if (lag && d) rows.push({ label: "Detection lag", value: lag, note: d.via === "traces" ? "requests failed before the ticket" : "alert fired before the ticket", cites: d.cites });
  if (r.ttr) rows.push({ label: "TTR", value: short(r.ttr.seconds), note: "ticket opened → resolved", cites: r.ttr.cites });
  if (r.impact) rows.push({ label: "Impact", value: short(r.impact.seconds), note: "first alert → resolved", cites: r.impact.cites });
  if (r.mttr) {
    const basis = r.mttr.basis === "same_ci" ? "this CI" : "similar titles";
    const ratio = r.ttr && r.mttr.seconds > 0 ? r.ttr.seconds / r.mttr.seconds : null;
    const note = ratio === null ? undefined : ratio >= 1.5 ? `${ratio.toFixed(1)}× slower than usual`
      : ratio <= 0.67 ? `${(1 / ratio).toFixed(1)}× faster than usual` : "about usual";
    rows.push({ label: "MTTR", value: short(r.mttr.seconds), note: `${note ? note + " · " : ""}${r.mttr.count} past on ${basis}`,
                warn: !!ratio && ratio >= 1.5, cites: r.mttr.cites });
  }
  return rows;
}

/** One slim row of timing numbers under the cards, so the cards stay short and equal. */
function Metrics({ rows, chip }: { rows: FactRow[]; chip: (id: string) => ReactNode }) {
  if (!rows.length) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-background/50 px-3 py-2.5 sm:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="label-mono text-[10px] font-bold text-muted-foreground">{row.label}</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-semibold text-foreground">{row.value}</span>
            {row.cites.map(chip)}
          </dd>
          {row.note && <div className={cn("text-[11px] leading-snug", row.warn ? "text-alert" : "text-muted-foreground")}>{row.note}</div>}
        </div>
      ))}
    </dl>
  );
}

function Fact({ icon, label, value, note, warn, cites, chip }: {
  icon: ReactNode; label: string; value: string; note?: string; warn?: boolean; cites: string[]; chip: (id: string) => ReactNode;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-2", warn ? "border-alert/40 bg-alert-soft" : "border-border bg-background/50")}>
      <div className="label-mono flex items-center gap-1.5 text-[10px] text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-[13px] font-medium text-foreground">{value}</div>
      {note && <div className="text-[12px] text-alert">{note}</div>}
      {cites.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{cites.map(chip)}</div>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border px-5 py-4">
      <h3 className="label-mono mb-3 text-[13px] font-bold tracking-wide text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function day(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";
}

/** Change requests near the incident, or the cited search that found none. Timing is computed; cause is never claimed. */
function ChangesBlock({ context, chips, withDate }: { context: Context; chips: (ids: string[]) => ReactNode; withDate: boolean }) {
  const changes = context.changes ?? [];
  const search = context.changeSearch;
  if (!changes.length && !search) return null;
  return (
    <Block title="Changes">
      <ol className="space-y-3">
        {changes.map((c) => (
          <li key={c.number} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3">
            <span className="pt-0.5 font-mono text-[12px] tabular-nums text-muted-foreground">{clock(c.at, withDate)}</span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-foreground">
                <GitBranch className="h-3.5 w-3.5 text-signal" />{c.number} · {c.title}
                {c.type && <span className="label-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{c.type} change</span>}
                {chips(c.cites)}
              </p>
              <p className={cn("text-[13px] leading-snug", c.before && (c.relation === "upstream" || c.relation === "incident") ? "text-alert" : "text-muted-foreground")}>
                {c.timing ?? `On ${c.ci}.`}
              </p>
              {(c.state || c.closeCode) && (
                <p className="text-[12px] text-muted-foreground">Status: {[c.state, c.closeCode].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {search && (
        <div className="flex items-start gap-2 text-[13px] text-foreground">
          <SearchX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div>
            <p><Quoted text={search.text} />{chips(search.cites)}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {search.from && search.to ? `Searched ${day(search.from)} – ${day(search.to)}` : "Searched"}
              {search.cis?.length ? ` · checked ${search.cis.join(", ")}` : ""}
            </p>
          </div>
        </div>
      )}
    </Block>
  );
}

/** CMDB neighbours of the incident CI, and which of them also showed symptoms. */
function DependenciesBlock({ context, chips }: { context: Context; chips: (ids: string[]) => ReactNode }) {
  const deps = context.dependencies ?? [];
  const impact = context.impact ?? [];
  if (!deps.length) return null;
  const own = context.incident.ci.replace(/^\[[^\]]*\]\s*/, "") || "this CI";
  const groups: { title: string; items: typeof deps }[] = [
    { title: `Rely on ${own}`, items: deps.filter((d) => d.direction === "downstream" && d.hop === 1) },
    { title: `Rely on ${own} indirectly`, items: deps.filter((d) => d.direction === "downstream" && d.hop > 1) },
    { title: `${own} relies on`, items: deps.filter((d) => d.direction === "upstream" && d.hop === 1) },
    { title: "Further back in the chain", items: deps.filter((d) => d.direction === "upstream" && d.hop > 1) },
  ].filter((g) => g.items.length);
  return (
    <Block title="Impact & dependencies">
      {impact.length > 0 && (
        <ul className="mb-3 space-y-1 text-[13px]">
          {impact.map((i, n) => (
            <li key={n} className="flex items-start gap-2 text-foreground">
              <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", i.direction === "downstream" ? "text-alert" : "text-muted-foreground")} />
              <span><Quoted text={i.text} />{chips(i.cites)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mb-2 text-[12px] text-muted-foreground">From the CMDB. Anything that relies on {own} can be hit when it fails.</p>
      <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title}>
            <dt className="label-mono mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Network className="h-3 w-3" />{g.title}</dt>
            {g.items.map((d) => (
              <dd key={d.ci} className="text-foreground">
                {d.ci}
                <span className="text-muted-foreground">
                  {d.via ? `, through ${d.via}` : ""}{d.kind && d.kind !== "depends on" ? ` (${d.kind})` : ""}
                </span>
                {chips(d.cites)}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </Block>
  );
}

/** Failed requests per service and calls seen in traces; calls the CMDB does not know about are flagged under gaps. */
function TracesBlock({ context, chips, withDate }: { context: Context; chips: (ids: string[]) => ReactNode; withDate: boolean }) {
  const t = context.traces;
  if (!t || (!t.services.length && !t.calls.length)) return null;
  return (
    <Block title="Traces">
      <ul className="space-y-1.5 text-[13px]">
        {t.services.map((s) => {
          const peers = Object.keys(s.peers);
          return (
            <li key={s.service} className="flex flex-wrap items-baseline gap-x-2">
              <Waypoints className="h-3.5 w-3.5 self-center text-alert" />
              <span className="text-foreground">
                <span className="font-medium">{s.service}</span>: {s.lowerBound ? "at least " : ""}{s.errorSpans} failed {s.errorSpans === 1 ? "request" : "requests"}
                {peers.length ? ` calling ${peers.join(", ")}` : ""}
              </span>
              {s.intervals.map(([a, b], n) => <span key={n} className="font-mono text-[12px] tabular-nums text-muted-foreground">{range(a, b, withDate)}</span>)}
              {chips(s.cites)}
            </li>
          );
        })}
        {t.calls.map((c) => (
          <li key={`${c.caller}>${c.callee}`} className={cn("flex flex-wrap items-baseline gap-x-2", c.inCmdb ? "text-muted-foreground" : "text-alert")}>
            <span>{c.caller} talks to {c.callee} ({c.calls} {c.calls === 1 ? "call" : "calls"} seen){c.inCmdb ? ", matches the CMDB" : ", but the CMDB does not record this"}</span>
            {chips(c.cites)}
          </li>
        ))}
      </ul>
    </Block>
  );
}

function ChatBlock({ context, chips }: { context: Context; chips: (ids: string[]) => ReactNode }) {
  const [showPossible, setShowPossible] = useState(false);
  const { linked, possible, excluded } = context.chat;
  if (!linked.length && !possible.length && !excluded.length) return null;
  return (
    <Block title="Team chat">
      <ul className="space-y-1 text-[13px]">
        {linked.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
            <span>{c.messages} message{c.messages === 1 ? "" : "s"} used — <Quoted text={c.reason} />{chips(c.cites)}</span>
          </li>
        ))}
        {!linked.length && <li className="text-muted-foreground">No conversation was confidently linked to this incident.</li>}
      </ul>
      {possible.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setShowPossible(!showPossible)} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("h-3 w-3 transition", showPossible && "rotate-180")} />
            {possible.length} possibly related conversation{possible.length === 1 ? "" : "s"} not used
          </button>
          {showPossible && (
            <ul className="mt-1 space-y-1 pl-4 text-[12px] text-muted-foreground">
              {possible.map((c) => <li key={c.id}>{c.preview} — <Quoted text={c.reason} />{chips(c.cites.slice(0, 4))}</li>)}
            </ul>
          )}
        </div>
      )}
      {excluded.length > 0 && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          {excluded.length} other conversation{excluded.length === 1 ? "" : "s"} in the same window left out: {excluded.map((c) => c.reason).join("; ")}
        </p>
      )}
    </Block>
  );
}

function CitationDetail({ id, context, timeline, onClose, chip }: {
  id: string; context: Context; timeline: Timeline | null; onClose: () => void; chip: (id: string) => ReactNode;
}) {
  const citation: Citation | undefined = context.citations[id];
  // The analysis carries a snapshot of each cited record; fall back to the live timeline for older analyses.
  const source = timeline?.evidence.find((s) => s.id === citation?.source);
  const live = source?.records.find((r) => r.id === citation?.record);
  const record = citation?.raw ? { id: citation.record ?? id, raw: citation.raw } : live;
  return (
    <div className="border-t border-border bg-background/60 px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono text-[10px] text-muted-foreground">Evidence {id} · {citation?.system === "srenity" ? "computed by SREnity from records" : citation?.sourceLabel ?? source?.label ?? citation?.system}</span>
        <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <p className="mt-1 text-[13px] text-foreground">{citation?.label ?? "This record is not in the current evidence."}</p>
      {citation?.derivedFrom && <p className="mt-1 text-[12px] text-muted-foreground">Derived from: <span className="inline-flex flex-wrap gap-1">{citation.derivedFrom.map(chip)}</span></p>}
      {source && <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{source.location}</div>}
      {record && (
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-card p-2 font-mono text-[11px] leading-relaxed text-foreground">
          {JSON.stringify({ record: record.id, ...record.raw }, null, 2)}
        </pre>
      )}
    </div>
  );
}
