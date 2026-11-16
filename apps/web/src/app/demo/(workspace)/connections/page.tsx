import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Activity, ArrowRight, Cloud, Hash, Plus, Unplug } from "lucide-react";
import { ActionButton } from "@/components/demo/ActionButton";
import { ConnectPanel } from "@/components/demo/ConnectPanel";
import { PrometheusConnectionForm } from "@/components/demo/PrometheusConnectionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceNowApp } from "@/components/demo/ServiceNowApp";
import { browserOrigin, connectorRequest, readUser, serviceNowCallbackUrl, type ConnectorConnection } from "@/lib/connector";
import { readSelectedReference } from "@/lib/servicenow/session";
import { setupVariant } from "@/lib/servicenow/setup";
import type { SlackConnections } from "@/lib/slack";
import { connectSlack, disconnectConnection, openServiceNow, testSlack } from "@/app/demo/connections/actions";

export const metadata: Metadata = { title: "Connections", robots: { index: false, follow: false } };
export const instant = false;

const providers = [
  { id: "servicenow", name: "ServiceNow", icon: Cloud, color: "bg-emerald-100 text-emerald-800", description: "Browse incidents and their evidence." },
  { id: "prometheus", name: "Prometheus", icon: Activity, color: "bg-orange-100 text-orange-800", description: "Explore metrics, scrape targets, and alerts." },
  { id: "slack", name: "Slack", icon: Hash, color: "bg-violet-100 text-violet-800", description: "Manage your Slack channel destinations." },
] as const;
type Provider = (typeof providers)[number]["id"];
type Row = { id: string; name: string; detail: string; provider: Provider; status: ConnectorConnection["status"] };

const button = "inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted active:bg-muted disabled:opacity-50";
const primary = "inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
const messages: Record<string, string> = {
  servicenow: "ServiceNow authorized. You can now open the incident viewer.",
  prometheus: "Prometheus connected.",
  disconnected: "Connection disconnected.",
  test: "Slack test message sent.",
};

function providerHref(provider: Provider) {
  return "/demo/connections?add=" + provider + "#connection-setup";
}

export default function Page({ searchParams }: PageProps<"/demo/connections">) {
  return <Suspense fallback={<div className="px-4 py-4 text-sm text-muted-foreground sm:p-8 lg:p-10">Loading connections…</div>}>
    <Connections searchParams={searchParams} />
  </Suspense>;
}

async function Connections({ searchParams }: Pick<PageProps<"/demo/connections">, "searchParams">) {
  const user = await readUser();
  if (!user) redirect("/demo/login");

  const [saved, slack, selected, params, requestHeaders] = await Promise.all([
    connectorRequest<{ connections: ConnectorConnection[] }>("/connections").catch(() => null),
    connectorRequest<SlackConnections>("/providers/slack/connections").catch(() => null),
    readSelectedReference(), searchParams, headers(),
  ]);
  const records = saved?.connections ?? [];
  const rows: Row[] = records.flatMap(row => {
    if (row.status === "disconnected" || (row.provider_id !== "servicenow" && row.provider_id !== "prometheus")) return [];
    const serviceNow = row.provider_id === "servicenow";
    const endpoint = row.instance_url.replace(/^https?:\/\//, "");
    return [{ id: row.id, name: serviceNow && row.name.startsWith("SREnity demo ") ? endpoint : row.name,
      detail: serviceNow && row.name.startsWith("SREnity demo ") ? row.instance_url : endpoint,
      provider: row.provider_id, status: row.status }];
  });
  for (const row of slack?.connections ?? []) {
    if (row.status === "disconnected") continue;
    rows.push({ id: row.id, name: row.channel_name, detail: row.workspace_name, provider: "slack", status: row.status });
  }
  const mode = providers.find(provider => provider.id === params.add);
  const filter = providers.find(provider => provider.id === (params.provider ?? params.add));
  const visible = filter ? rows.filter(row => row.provider === filter.id) : rows;
  const reconnect = records.find(row => row.id === params.reconnect && row.provider_id === mode?.id && row.status !== "connected");
  const app = records.find(row => row.id === params.app && row.provider_id === "servicenow" && row.status === "connected");
  const callbackUrl = serviceNowCallbackUrl();
  const success = typeof params.status === "string" ? messages[params.status] : undefined;
  const slackSuccess = params.slackStatus === "Slack channel connected.";
  const error = typeof params.error === "string" ? params.error : typeof params.slackError === "string" ? params.slackError : "";

  return (
    <main id="demo-content" className="px-3 py-4 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-start justify-between gap-3 px-1 sm:mb-8 sm:items-end sm:gap-4 sm:px-0">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">{filter?.name ?? "Connections"}</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-3 sm:text-base">{filter?.description ?? "Manage your ServiceNow instances, Prometheus servers, and Slack channels."}</p>
          </div>
          <div className="mt-1 shrink-0 whitespace-nowrap rounded-md border border-signal/25 bg-signal-soft px-2.5 py-1 text-xs text-signal sm:mt-0 sm:px-3.5 sm:py-2 sm:text-sm">
            {visible.filter(row => row.status === "connected").length} connected
          </div>
        </header>

        {params.add === "choose" && <section aria-label="Choose an integration" className="mb-4 rounded-xl border border-border bg-card p-3 sm:mb-5 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Add a connection</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/demo/connections">Cancel</Link></Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {providers.map(provider => <Button asChild key={provider.id} variant="outline" className="justify-start">
              <Link href={providerHref(provider.id)}><provider.icon data-icon="inline-start" />{provider.name}<Plus className="ml-auto" /></Link>
            </Button>)}
          </div>
        </section>}

        <section id="slack-connections" className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-3.5">
            <h2 className="text-sm font-semibold">Saved connections</h2>
          </header>
          <div className="space-y-3 px-4 pt-4 empty:hidden sm:px-6">
            {(success || slackSuccess) && <p role="status" className="rounded-md bg-signal-soft px-3 py-2 text-sm">{success ?? "Slack channel connected."}</p>}
            {error && <p role="alert" className="rounded-md bg-alert-soft px-3 py-2 text-sm">{error}</p>}
            {(!saved || !slack) && <p role="alert" className="rounded-md bg-alert-soft px-3 py-2 text-sm">Could not load {!saved && !slack ? "connections" : !slack ? "Slack connections" : "ServiceNow and Prometheus connections"}. Refresh to retry.</p>}
          </div>
          {visible.length ? <ul className="divide-y divide-border">
            {visible.map(row => {
              const provider = providers.find(item => item.id === row.provider)!;
              const active = row.provider === "servicenow" && row.status === "connected" && selected?.id === row.id;
              return (
                <li key={row.id} className="grid gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={"grid size-9 shrink-0 place-items-center rounded-lg " + provider.color}><provider.icon size={17} aria-hidden /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-all text-sm font-semibold">{row.name}</h3>
                        <Badge variant={row.status === "connected" ? "secondary" : "outline"}>
                          {row.status === "connected" && <span aria-hidden className="size-1.5 rounded-full bg-signal" />}
                          {row.status === "connected" ? "Connected" : "Reauthorization required"}
                        </Badge>
                        {active && <Badge variant="outline">Selected for incidents</Badge>}
                      </div>
                      <p className="mt-1 break-all text-xs text-muted-foreground">{provider.name} · {row.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 sm:pl-12 lg:max-w-[22rem] lg:justify-end lg:pl-0 max-sm:[&>*]:grow max-sm:[&>*]:justify-center max-sm:[&_button]:w-full max-sm:[&_button]:justify-center">
                    {row.status === "connected" ? <>
                      {row.provider === "servicenow" && <>
                        <ActionButton action={openServiceNow.bind(null, row.id)} className={button}>Open incidents <ArrowRight size={13} /></ActionButton>
                        <Link href={"/demo/connections?app=" + row.id + "#servicenow-app"} className={button}>Manage native app</Link>
                      </>}
                      {row.provider === "prometheus" && <Link className={button} href={"/demo/prometheus?connection=" + row.id}>Explore metrics <ArrowRight size={13} /></Link>}
                      {row.provider === "slack" && <ActionButton action={testSlack.bind(null, row.id)} className={button}>Send test message</ActionButton>}
                    </> : <Link className={button} href={"/demo/connections?add=" + row.provider + "&reconnect=" + row.id + "#connection-setup"}>Reconnect <ArrowRight size={13} /></Link>}
                    <ActionButton action={disconnectConnection.bind(null, row.id, row.provider)} className={button}
                      confirm={"Disconnect " + row.name + " and delete its saved connection from SREnity?"}><Unplug size={13} /> Disconnect</ActionButton>
                  </div>
                </li>
              );
            })}
          </ul> : (saved || slack) && <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">No {filter ? filter.name + " connections" : "connections"} to show.</p>}
        </section>

        {mode && <section id="connection-setup" className="mt-4 scroll-mt-16 rounded-xl border border-border bg-card p-4 text-foreground sm:mt-6 sm:scroll-mt-20 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <h2 className="font-display text-xl sm:text-2xl">{params.reconnect ? "Reconnect" : "Connect"} {mode.name}</h2>
            <Link href={filter ? "/demo/connections?provider=" + filter.id : "/demo/connections"} className={button + " shrink-0"}>Close<span className="hidden sm:inline">&nbsp;setup</span></Link>
          </div>
          <div className="max-w-xl">
            {mode.id === "servicenow" && <ConnectPanel key={reconnect?.id ?? "new"} callbackUrl={callbackUrl} setupVariant={setupVariant(callbackUrl)} saved={reconnect} />}
            {mode.id === "prometheus" && <PrometheusConnectionForm key={reconnect?.id ?? "new"} saved={reconnect} />}
            {mode.id === "slack" && (slack?.configured ? <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose the workspace and channel in Slack. Reauthorizing the same channel refreshes its saved connection.</p>
              <ActionButton action={connectSlack} className={primary}>Continue to Slack <ArrowRight size={14} /></ActionButton>
            </div> : <p role="status" className="text-sm text-muted-foreground">{slack ? "Configure Slack OAuth on the connector before adding a channel." : "Slack connection settings are unavailable. Refresh to retry."}</p>)}
          </div>
        </section>}
        {!mode && !app && <a href="/api/servicenow/app/package" download className="mt-4 ml-1 inline-block py-1 text-xs sm:mt-5 sm:ml-0 text-muted-foreground underline-offset-4 hover:underline">Download ServiceNow app package</a>}
        {app && <div id="servicenow-app" className="mt-4 scroll-mt-16 sm:mt-6 sm:scroll-mt-6">
          <p className="mb-2 break-all px-1 text-sm text-muted-foreground sm:mb-3 sm:px-0">{app.instance_url}</p>
          <ServiceNowApp key={app.id} connectionId={app.id} />
        </div>}
      </div>
    </main>
  );
}
