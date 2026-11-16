"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { connectPrometheus } from "@/app/demo/connections/actions";

const field = "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-signal";

export function PrometheusConnectionForm({ saved }: { saved?: { id: string; name: string; instance_url: string } }) {
  const [error, submit, pending] = useActionState(connectPrometheus.bind(null, saved?.id ?? null), "");
  const [auth, setAuth] = useState("none");

  return (
    <form action={submit}>
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
        <label className="block text-sm font-medium">Connection name
          <input name="name" className={field} required maxLength={120} defaultValue={saved?.name} readOnly={Boolean(saved)} placeholder="Production metrics" />
        </label>
        <label className="block text-sm font-medium">Prometheus URL
          <input name="url" type="url" className={field} required maxLength={2048} defaultValue={saved?.instance_url} readOnly={Boolean(saved)} placeholder="https://prometheus.example.com" />
        </label>
        <label className="block text-sm font-medium">Authentication
          <select name="auth_type" className={field} value={auth} onChange={event => setAuth(event.target.value)}>
            <option value="none">No authentication</option>
            <option value="bearer">Bearer token</option>
            <option value="basic">Username and password</option>
          </select>
        </label>
        {auth === "bearer" && <label className="block text-sm font-medium">Bearer token
          <input name="bearer_token" type="password" autoComplete="off" required maxLength={8192} className={field} />
        </label>}
        {auth === "basic" && <>
          <label className="block text-sm font-medium">Username<input name="username" autoComplete="off" required maxLength={256} className={field} /></label>
          <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete="new-password" required maxLength={8192} className={field} /></label>
        </>}
        {error && <p role="alert" className="rounded-md bg-alert-soft p-3 text-sm text-foreground">{error}</p>}
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {pending ? "Testing connection…" : "Test and connect"}
        </button>
      </fieldset>
    </form>
  );
}
