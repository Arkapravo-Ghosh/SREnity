"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import { connectServiceNow } from "@/app/demo/connections/actions";
import type { SetupVariant } from "@/lib/servicenow/setup";

const field = "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-signal";
const secondary = "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted";

export function ConnectPanel({ callbackUrl, setupVariant, saved }: {
  callbackUrl: string;
  setupVariant: SetupVariant;
  saved?: { id: string; instance_url: string };
}) {
  const [error, submit, pending] = useActionState(connectServiceNow.bind(null, saved?.id ?? null), "");
  const [custom, setCustom] = useState(false);
  return (
    <form action={submit} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <label className="block text-sm font-medium">
          Instance address
          <input name="instance" className={field} defaultValue={saved?.instance_url} readOnly={Boolean(saved)}
            placeholder="yourcompany.service-now.com" autoComplete="off" spellCheck={false} required />
        </label>
        <details className="rounded-lg border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium">OAuth setup and downloads</summary>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>For a new instance, import, preview, and commit the {setupVariant === "local" ? "local development" : "production"} OAuth setup file under <strong>System Update Sets → Retrieved Update Sets</strong>.</p>
            <div className="flex flex-wrap gap-2">
              <a href="/api/servicenow/setup" download className={secondary}><Download size={14} /> OAuth setup (.xml)</a>
              <a href="/api/servicenow/app/package" download className={secondary}><Download size={14} /> Native app (.zip)</a>
            </div>
            <p className="text-xs">Your ServiceNow OAuth client must allow this exact redirect URL.</p>
            <code className="block break-all rounded bg-muted px-3 py-2 text-xs text-foreground">{callbackUrl}</code>
            <label className="flex items-center gap-2 text-foreground">
              <input type="checkbox" name="custom" checked={custom} onChange={event => setCustom(event.target.checked)} />
              Use my own OAuth client
            </label>
            {custom && <div className="space-y-3 text-foreground">
              <label className="block text-sm">Client ID<input name="client_id" maxLength={200} required className={field} /></label>
              <label className="block text-sm">Client secret (optional)<input name="client_secret" type="password" maxLength={4096} autoComplete="new-password" className={field} /></label>
              <label className="block text-sm">OAuth scope (optional)<input name="scope" maxLength={500} className={field} /></label>
            </div>}
          </div>
        </details>
        {error && <p role="alert" className="rounded-md bg-alert-soft p-3 text-sm text-foreground">{error}</p>}
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {pending ? "Preparing authorization…" : "Continue to ServiceNow"}
        </button>
      </fieldset>
    </form>
  );
}
