import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowRight } from "lucide-react";
import { connectorRequest, type ConnectorConnection } from "@/lib/connector";

type Snapshot = {
  targets: { ok: true; data: { healthy: number; total: number } } | { ok: false };
  alerts: { ok: true; data: { firing: number } } | { ok: false };
};

async function MetricsSummary({ id }: { id: string }) {
  const snapshot = await connectorRequest<Snapshot>("/connections/" + id + "/prometheus/snapshot").catch(() => null);
  if (!snapshot) return <p className="text-sm text-muted-foreground">Live metrics unavailable.</p>;
  return <dl className="grid grid-cols-2 gap-4 text-sm">
    <div><dt className="text-muted-foreground">Targets up</dt><dd className="mt-1 font-semibold">{snapshot.targets.ok ? snapshot.targets.data.healthy + " / " + snapshot.targets.data.total : "Unavailable"}</dd></div>
    <div><dt className="text-muted-foreground">Firing alerts</dt><dd className="mt-1 font-semibold">{snapshot.alerts.ok ? snapshot.alerts.data.firing : "Unavailable"}</dd></div>
  </dl>;
}

export function AllMetrics({ servers }: { servers: ConnectorConnection[] }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-6 sm:px-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">All Metrics</h1>
        <Link href="/demo/connections?provider=prometheus" className="shrink-0 whitespace-nowrap rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-muted active:bg-muted sm:text-sm"><span className="sm:hidden">Manage</span><span className="hidden sm:inline">Manage connections</span></Link>
      </div>
      {servers.length ? <div className="grid gap-4 xl:grid-cols-2">
        {servers.map(server => <section key={server.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal"><Activity size={18} /></span>
            <div className="min-w-0">
              <h2 className="break-words font-display text-lg font-semibold sm:text-xl">{server.name}</h2>
              <p className="break-all text-xs text-muted-foreground">{server.instance_url}</p>
            </div>
          </div>
          <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading live metrics…</p>}><MetricsSummary id={server.id} /></Suspense>
          <Link href={"/demo/prometheus?connection=" + server.id} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-signal hover:underline">Explore metrics <ArrowRight size={14} /></Link>
        </section>)}
      </div> : <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Connect a Prometheus server to view its metrics here.</p>}
    </div>
  );
}
