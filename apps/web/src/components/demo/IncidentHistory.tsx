"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, History, Lightbulb, RefreshCw, Wrench } from "lucide-react";
import { ApiError, fetchHistory } from "@/lib/demoClient";
import type { IncidentHistory as History_ } from "@/lib/ai/types";
import { cn } from "@/lib/utils";
import { EvidenceChip } from "./EvidenceChip";
import { SyncedAt } from "./IncidentContext";
import { quoteStyle, Quoted } from "./Quoted";

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "";
}

/** Similar resolved incidents, how each was fixed (quoted from its own records) and what that means here. */
export function IncidentHistory({ sysId }: { sysId: string }) {
  const [history, setHistory] = useState<History_ | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState({ n: 0, refresh: false });
  const [openCite, setOpenCite] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(sysId, run.refresh)
      .then((result) => {
        if (!cancelled) {
          setHistory(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ApiError ? cause.message : "Couldn't load similar incidents.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sysId, run]);

  const rebuild = () => {
    setLoading(true);
    setRun((r) => ({ n: r.n + 1, refresh: true }));
  };
  const chip = (id: string) => <EvidenceChip key={id} id={id} active={openCite === id} onClick={() => setOpenCite(openCite === id ? null : id)} />;
  const chips = (ids: string[]) => <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">{ids.map(chip)}</span>;
  const cited = openCite && history?.citations[openCite];

  return (
    <section className="pop-in overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <span className="label-mono inline-flex items-center gap-1.5 text-signal"><History className="h-3 w-3" /> Historical analysis</span>
        <span className="flex items-center gap-3">
        <SyncedAt at={history?.savedAt ?? history?.generatedAt} fromSaved={history?.fromSaved} />
        <button title="Search past incidents and run the AI comparison again" onClick={rebuild} disabled={loading} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> {loading ? "Syncing…" : "Resync"}
        </button>
        </span>
      </div>

      {!history ? (
        <div className="px-5 pb-5 pt-3">
          {error ? (
            <p className="flex items-start gap-2 text-sm text-alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
          ) : (
            <div className="space-y-2">
              {[0, 1, 2].map((n) => <div key={n} className="h-4 animate-pulse rounded bg-background/70" style={{ width: `${90 - n * 15}%` }} />)}
              <p className="pt-1 font-mono text-[11px] text-muted-foreground">Searching resolved incidents with the same configuration item or wording…</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {history.takeaways.length > 0 ? (
            <ul className="space-y-1.5 px-5 pt-3 text-[15px] leading-snug text-foreground">
              {history.takeaways.map((t, n) => (
                <li key={n} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" /><span><Quoted text={t.text} />{chips(t.cites)}</span></li>
              ))}
            </ul>
          ) : (
            <p className="px-5 pt-3 text-[15px] leading-relaxed text-foreground">
              {history.matches.length ? `${history.matches.length} similar resolved ${history.matches.length === 1 ? "incident" : "incidents"} found.` : "No similar resolved incidents found."}
            </p>
          )}
          <p className="px-5 pb-4 pt-1 font-mono text-[11px] text-muted-foreground">
            Searched resolved incidents on the same configuration item{history.searched.keywords.length ? ` or mentioning ${history.searched.keywords.join(", ")}` : ""} · {history.searched.candidates} candidates
          </p>

          {cited && (
            <div className="border-t border-border bg-background/60 px-5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="label-mono text-[10px] text-muted-foreground">Evidence {openCite} · ServiceNow</span>
                <button onClick={() => setOpenCite(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <p className="mt-1 text-[13px] text-foreground">{cited.label}</p>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-card p-2 font-mono text-[11px] leading-relaxed text-foreground">
                {JSON.stringify(cited.raw, null, 2)}
              </pre>
            </div>
          )}

          <ol>
            {history.matches.map((m) => (
              <li key={m.id} className="border-t border-border px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[14px] font-medium text-foreground">
                    <span className="font-mono">{m.number}</span> · {m.title}{chips([m.id])}
                  </p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {day(m.resolvedAt) && `resolved ${day(m.resolvedAt)}`}{m.timeToResolve && ` · took ${m.timeToResolve}`}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.matchedBy.map((r) => <span key={r} className="label-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{r}</span>)}
                </div>
                {m.why && <p className="mt-2 text-[13px] text-muted-foreground"><Quoted text={m.why} />{chips(m.cites.filter((c) => c !== m.id))}</p>}
                <Row icon={<Wrench className="h-3.5 w-3.5" />} label="How it was resolved">
                  {m.resolution || m.quotes.length ? (
                    <>
                      {m.resolution && <span className="text-foreground"><Quoted text={m.resolution} /> </span>}
                      {m.quotes.map((q, i) => (
                        <span key={i} className="mt-1 block border-l-2 border-signal/50 pl-2"><span className={quoteStyle}>“{q.text}”</span>{chips([q.cite])}</span>
                      ))}
                    </>
                  ) : <span className="text-alert">Not recorded on this ticket.</span>}
                </Row>
                {m.lesson && (
                  <Row icon={<Lightbulb className="h-3.5 w-3.5" />} label="What it means for this incident">
                    <span className="text-foreground"><Quoted text={m.lesson} /></span>
                  </Row>
                )}
              </li>
            ))}
          </ol>

          {history.gaps.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <h3 className="label-mono mb-3 text-[13px] font-bold tracking-wide text-foreground">Gaps and flags</h3>
              <ul className="space-y-1 text-[13px]">
                {history.gaps.map((g, n) => (
                  <li key={n} className="flex items-start gap-2 text-foreground"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" /><span><Quoted text={g.text} />{chips(g.cites)}</span></li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="mt-2.5 grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-3 text-[13px]">
      <span className="label-mono flex items-start gap-1.5 pt-0.5 text-[12px] font-bold text-foreground">{icon}{label}</span>
      <div>{children}</div>
    </div>
  );
}
