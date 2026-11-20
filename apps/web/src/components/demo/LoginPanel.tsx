"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { loginAction } from "@/app/demo/authActions";

const input = "mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-signal";

export function LoginPanel() {
  const [error, submit, pending] = useActionState(loginAction, "");
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-8 py-6 sm:py-12 md:grid-cols-2 md:gap-12">
      <div>
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Sign in to SREnity</h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">Open your incident workspace and manage the integrations connected to your account.</p>
      </div>
      <form action={submit} className="rounded-xl border border-border bg-card p-6 text-foreground shadow-2xl sm:p-8">
        <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
          <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="username" required className={input} /></label>
          <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" required className={input} /></label>
          {error && <p role="alert" className="rounded-md bg-alert-soft p-3 text-sm text-foreground">{error}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
