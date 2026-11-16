"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Activity, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ConnectorConnection } from "@/lib/connector";

type Metric = { metric?: Record<string, string>; value?: [number, string]; values?: [number, string][] };
type QueryResult = { resultType: "vector" | "scalar" | "string" | "matrix"; result: Metric[] | [number, string]; truncated: boolean; seriesLimit: number };
type Section<T> = { ok: true; data: T } | { ok: false; error: string };
type Snapshot = {
  query: Section<QueryResult>;
  targets: Section<{ total: number; healthy: number; items: { job: string; instance: string; health: string; lastScrape: string; lastError: string }[]; truncated: boolean }>;
  alerts: Section<{ total: number; firing: number; items: { name: string; state: string; severity: string; summary: string }[]; truncated: boolean }>;
};
const fieldClass = "mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-signal/25";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The connector could not complete this request.");
  return body as T;
}

export function PrometheusPanel({ connection }: { connection?: ConnectorConnection }) {
  const selected = connection?.id;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(connection));
  const [query, setQuery] = useState("up");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryBusy, setQueryBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const requestVersion = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    if (!selected) return () => controller.abort();
    request<Snapshot>(`/api/prometheus/connections/${selected}/snapshot`, { signal: controller.signal })
      .then(result => { if (requestVersion.current === version) { setSnapshot(result); if (result.query.ok) setQueryResult(result.query.data); } })
      .catch(cause => { if (!controller.signal.aborted && requestVersion.current === version) setError(cause instanceof Error ? cause.message : "Could not load Prometheus."); })
      .finally(() => { if (!controller.signal.aborted && requestVersion.current === version) setLoading(false); });
    return () => controller.abort();
  }, [selected, refresh]);

  function refreshMetrics() {
    requestVersion.current += 1;
    setLoading(true);
    setError("");
    setRefresh(value => value + 1);
  }

  async function runQuery(event: FormEvent) {
    event.preventDefault(); if (!selected || queryBusy) return;
    const version = requestVersion.current;
    setQueryBusy(true); setError("");
    try {
      const result = await request<QueryResult>(`/api/prometheus/connections/${selected}/query`, { method: "POST", body: JSON.stringify({ query }) });
      if (version === requestVersion.current) setQueryResult(result);
    } catch (cause) { if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "Query failed."); }
    finally { setQueryBusy(false); }
  }
  return <div className="space-y-4 sm:space-y-6">
    <div className="flex items-start justify-between gap-3 px-1 sm:items-end sm:px-0">
      <div className="min-w-0"><h1 className="font-display text-2xl text-foreground sm:text-3xl">Prometheus metrics</h1><p className="mt-1 text-sm text-muted-foreground sm:mt-2">Inspect scrape targets, active alerts, and PromQL results.</p></div>
      <Link href="/demo/connections?provider=prometheus" className="shrink-0 whitespace-nowrap rounded-md border border-border px-3 py-2 text-xs hover:bg-muted active:bg-muted"><span className="sm:hidden">Manage</span><span className="hidden sm:inline">Manage connections</span></Link>
    </div>
      <div className="min-w-0 space-y-3 sm:space-y-5">
        {connection ? <>
          <div className="flex items-start justify-between gap-3 px-1 sm:px-0"><div className="min-w-0"><h2 className="font-display text-xl sm:text-2xl">{connection.name}</h2><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{connection.instance_url}</p></div><div className="flex shrink-0 gap-2"><button onClick={refreshMetrics} disabled={loading} aria-label="Refresh" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs active:bg-muted disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></button></div></div>
          {loading && <p role="status" className="text-sm text-muted-foreground">Reading live Prometheus data…</p>}
          {error && <p role="alert" className="rounded-md border border-alert/40 bg-alert-soft p-3 text-sm">{error}</p>}
          {snapshot && <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3"><Stat label="Targets up" value={snapshot.targets.ok ? `${snapshot.targets.data.healthy} / ${snapshot.targets.data.total}` : "Unavailable"} /><Stat label="Firing alerts" value={snapshot.alerts.ok ? String(snapshot.alerts.data.firing) : "Unavailable"} /><Stat label="Query API" value={snapshot.query.ok ? "Connected" : "Unavailable"} /></div>
            <section className="rounded-lg border border-border bg-card/40 p-4 sm:p-5"><h3 className="font-display text-lg sm:text-xl">Scrape targets</h3>{snapshot.targets.ok ? <div className="mt-3 sm:mt-4"><ul className="divide-y divide-border text-xs sm:hidden">{snapshot.targets.data.items.map((target, i) => <li key={`${target.job}:${target.instance}:${i}`} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="font-medium">{target.job}</p><p className="break-all font-mono text-[11px] text-muted-foreground">{target.instance}</p></div><span className={`label-mono shrink-0 ${target.health === "up" ? "text-signal" : "text-alert"}`}>{target.health}</span></li>)}</ul><div className="hidden overflow-x-auto sm:block"><table className="w-full text-left text-xs"><thead className="label-mono text-muted-foreground"><tr><th className="p-2">Job</th><th className="p-2">Instance</th><th className="p-2">Health</th></tr></thead><tbody>{snapshot.targets.data.items.map((target, i) => <tr key={`${target.job}:${target.instance}:${i}`} className="border-t border-border"><td className="p-2">{target.job}</td><td className="p-2 font-mono">{target.instance}</td><td className={`p-2 ${target.health === "up" ? "text-signal" : "text-alert"}`}>{target.health}</td></tr>)}</tbody></table></div>{snapshot.targets.data.total === 0 && <p className="py-3 text-muted-foreground">No active targets.</p>}{snapshot.targets.data.truncated && <p className="mt-2 text-muted-foreground">Showing the first 200 targets.</p>}</div> : <p className="mt-3 text-sm text-muted-foreground">{snapshot.targets.error}</p>}</section>
            <section className="rounded-lg border border-border bg-card/40 p-4 sm:p-5"><h3 className="font-display text-lg sm:text-xl">Active alerts</h3>{snapshot.alerts.ok ? <div className="mt-3 space-y-3">{snapshot.alerts.data.items.length ? snapshot.alerts.data.items.map((alert, i) => <div key={`${alert.name}:${i}`} className="rounded border border-border p-3 text-sm"><p className="font-medium">{alert.name} <span className="ml-2 text-xs text-muted-foreground">{alert.state} {alert.severity}</span></p>{alert.summary && <p className="mt-1 text-xs text-muted-foreground">{alert.summary}</p>}</div>) : <p className="text-sm text-muted-foreground">No active alerts.</p>}</div> : <p className="mt-3 text-sm text-muted-foreground">{snapshot.alerts.error}</p>}</section>
          </>}
          <section className="rounded-lg border border-border bg-card/40 p-4 sm:p-5"><h3 className="font-display text-lg sm:text-xl">Explore metrics</h3><form onSubmit={runQuery} className="mt-3 flex items-end gap-2 sm:gap-3"><div className="min-w-0 flex-1"><label htmlFor="prom-query" className="label-mono text-muted-foreground">PromQL expression</label><input id="prom-query" value={query} onChange={e => setQuery(e.target.value)} maxLength={4096} required className={`${fieldClass} font-mono`} /></div><button disabled={queryBusy || loading || !query.trim()} className={`${buttonClass} shrink-0 px-3 sm:px-4`}>{queryBusy ? "Running…" : <>Run<span className="hidden sm:inline">&nbsp;query</span></>}</button></form><p className="mt-2 text-[11px] text-muted-foreground">Instant query · up to 100 series</p>{queryResult && <QueryTable data={queryResult} />}</section>
        </> : <div className="rounded-lg border border-dashed border-border p-8 text-center"><Activity className="mx-auto h-8 w-8 text-signal" /><h2 className="mt-4 font-display text-2xl">Bring your metrics into SREnity</h2><p className="mt-2 text-sm text-muted-foreground">Connect a Prometheus server to view live metrics, targets, and alerts.</p><Link href="/demo/connections?add=prometheus#connection-setup" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Add a server</Link></div>}
      </div>
  </div>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-lg border border-border bg-card/40 p-3 sm:p-4"><p className="label-mono text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{label}</p><p className="mt-1 truncate font-display text-lg sm:mt-2 sm:text-2xl">{value}</p></div>; }
function QueryTable({ data }: { data: QueryResult }) {
  if (data.resultType === "scalar" || data.resultType === "string") return <p className="mt-4 break-all rounded border border-border p-3 font-mono text-sm">{String(data.result[1])}</p>;
  const metrics = data.result as Metric[];
  return <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="label-mono text-muted-foreground"><tr><th className="p-2">Metric / labels</th><th className="p-2">Value</th></tr></thead><tbody>{metrics.map((metric, i) => <tr key={i} className="border-t border-border"><td className="min-w-48 break-all p-2 font-mono">{JSON.stringify(metric.metric ?? {})}</td><td className="p-2 font-mono">{metric.value?.[1] ?? metric.values?.at(-1)?.[1] ?? "—"}</td></tr>)}</tbody></table>{!metrics.length && <p className="py-3 text-sm text-muted-foreground">No series matched this query.</p>}{data.truncated && <p className="mt-2 text-xs text-muted-foreground">Results truncated. Narrow your query.</p>}</div>;
}
