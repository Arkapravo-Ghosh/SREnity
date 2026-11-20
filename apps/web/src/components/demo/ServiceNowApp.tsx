"use client";
import { useEffect, useState } from "react";
import { installServiceNowApp } from "@/app/demo/connections/actions";
import { Check, Download, Loader2, PackagePlus, RefreshCw } from "lucide-react";

type App = { name: string; state: "missing" | "installed" | "incomplete"; version: string | null; availableVersion: string; message: string; applicationUrl: string };
type Installation = { id: string; state: "queued" | "uploading" | "tracking" | "succeeded" | "failed" | "needs_review"; progress: number; message: string; tracker_id: string | null };
export type ServiceNowAppResult = { app: App; installation: Installation | null; alreadyInstalled?: boolean };
const active = (job: Installation | null) => Boolean(job && ["queued", "uploading", "tracking"].includes(job.state));
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The ServiceNow app request could not be completed.");
  return body as T;
}
export function ServiceNowApp({ connectionId }: { connectionId: string }) {
  const [app, setApp] = useState<App | null>(null);
  const [job, setJob] = useState<Installation | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [revision, setRevision] = useState(0);
  const jobId = job?.id;
  const jobState = job?.state;
  useEffect(() => {
    const controller = new AbortController();
    request<ServiceNowAppResult>("/api/servicenow/app/status?connection=" + connectionId, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setApp(result.app); setJob(result.installation); } })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not check the ServiceNow application."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [connectionId, revision]);
  useEffect(() => {
    if (!jobId || !["queued", "uploading", "tracking"].includes(jobState ?? "")) return;
    const controller = new AbortController();
    const id = jobId;
    let pending = false;
    const timer = setInterval(() => {
      if (pending) return;
      pending = true;
      request<{ installation: Installation }>(`/api/servicenow/app/installations/${id}?connection=${connectionId}`, { signal: controller.signal })
        .then(result => {
          if (controller.signal.aborted) return;
          setJob(result.installation);
          if (result.installation.state === "succeeded") setRevision(n => n + 1);
        })
        .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not read installation progress."); })
        .finally(() => { pending = false; });
    }, 3000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [connectionId, jobId, jobState]);
  async function install() {
    if (installing || active(job) || app?.state !== "missing") return;
    setInstalling(true); setError("");
    try {
      const response = await installServiceNowApp(connectionId, crypto.randomUUID());
      if ("error" in response) throw new Error(response.error);
      setApp(response.result.app); setJob(response.result.installation);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not install the application."); }
    finally { setInstalling(false); }
  }
  const busy = installing || active(job);
  const installed = app?.state === "installed";
  return <section aria-label="ServiceNow application" className="mb-6 rounded-lg border border-border bg-card/40 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h2 className="font-display text-lg sm:text-xl">ServiceNow app</h2><p className="mt-1 text-sm text-muted-foreground">{app ? `${app.name}${app.version ? ` · ${app.version}` : ""}` : "Manage the native application on this ServiceNow instance."}</p><p className="mt-2 text-xs text-muted-foreground">{loading ? "Checking your instance…" : app?.message}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setLoading(true); setError(""); setRevision(n => n + 1); }} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Check app</button>
        {installed ? <><span className="inline-flex items-center gap-2 rounded-md border border-signal/30 px-3 py-2 text-xs text-signal"><Check className="h-4 w-4" />App installed</span><a href={app.applicationUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-xs">Open app</a></> : <button onClick={install} disabled={loading || busy || app?.state !== "missing" || job?.state === "needs_review"} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}{busy ? "Installing…" : "Install app"}</button>}
        {!loading && !installed && <a href="/api/servicenow/app/package" download className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"><Download className="h-3.5 w-3.5" />Download package</a>}
      </div>
    </div>
    {busy && job && <div className="mt-4"><p role="status" className="text-xs text-muted-foreground">{job.message} {job.progress > 0 ? `${job.progress}%` : ""}</p><progress className="mt-2 h-2 w-full accent-teal-400" max={100} value={job.progress} /></div>}
    {job && ["failed", "needs_review"].includes(job.state) && !installed && <p role="alert" className="mt-3 border-l-2 border-alert pl-3 text-sm">{job.message}</p>}
    {error && <p role="alert" className="mt-3 border-l-2 border-alert pl-3 text-sm">{error}</p>}
    {!installed && !loading && app?.state === "missing" && <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Installs the native bridge using the official ServiceNow application package. Requires an instance admin grant. Existing applications are preserved.</p>}
  </section>;
}
