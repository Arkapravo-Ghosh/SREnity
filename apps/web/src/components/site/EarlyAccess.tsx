"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { SIGNUP_ENDPOINT, SITE } from "@/lib/site";
import ParticlesBg from "@/components/ui/particles-bg";
import { Reveal } from "./Reveal";

const PERKS = [
  ["Founding-team discount", "A locked-in discount on your first year, for early sign-ups only."],
  ["Priority pilot slot", "Onboarded first, on your own incidents, with us on the call."],
  ["Shape the roadmap", "Tell us your stack and your worst incident; it decides what we build next."],
];

const ROLES = ["NOC / network engineer", "SRE / on-call engineer", "Ops or IT manager", "MSP lead", "Other"];

type Status = { state: "idle" | "sending" | "done" | "error" };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground sm:text-sm placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal/30";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function EarlyAccess() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [email, setEmail] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (data._honey) return; // bots fill the hidden field
    setStatus({ state: "sending" });
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data,
          _subject: `SREnity early access: ${data.email}`,
          _replyto: data.email,
          _template: "table",
          _captcha: "false",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
      if (!res.ok || String(body.success) !== "true") {
        throw new Error(body.message || "Something went wrong.");
      }
      setEmail(data.email);
      setStatus({ state: "done" });
      track("generate_lead", { method: "early_access_form", role: data.role });
    } catch (err) {
      // Provider messages (e.g. FormSubmit's activation notice) are for us, not for visitors.
      console.error("Early-access sign-up failed:", err);
      setStatus({ state: "error" });
    }
  };

  return (
    <section id="early-access" className="tone-dark relative overflow-hidden scroll-mt-14 pt-14 sm:pt-20 md:scroll-mt-16 md:pt-28">
      <ParticlesBg className="absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="label-mono flex items-center gap-2 text-signal">
            <span className="h-1.5 w-1.5 animate-pulse bg-signal" />
            Coming soon · early access open
          </div>
          {/* Phones: pitch → form → perks, so the sign-up CTAs land next to the form. From lg the
            form sits in its own column beside the pitch and perks. */}
          <div className="mt-5 grid gap-8 sm:mt-6 sm:gap-12 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
            <div className="lg:col-start-1 lg:row-start-1">
              <h2 className="font-display text-4xl leading-[1.05] sm:text-6xl lg:text-5xl xl:text-6xl">
                Your next incident,
                <br />
                <span className="text-muted-foreground">already explained.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:mt-6">
                SREnity is in private build with network operations and MSP teams. Join the
                early-access list and be first in line when we launch.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
              {status.state === "done" ? (
                <div className="pop-in flex h-full flex-col items-start justify-center py-10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal text-primary-foreground">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                  <h3 className="font-display mt-6 text-3xl text-foreground">You&apos;re on the list.</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    We&apos;ll write to <span className="text-foreground">{email}</span> before launch
                    with your founding-team discount and a pilot slot. Reply with your ticketing tool
                    and your worst recent incident: it decides what we build first.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <h3 className="font-display text-2xl text-foreground">Get early access</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Two fields. No spam, ever.</p>
                  </div>
                  {/* Kept to two fields on purpose: stack and pain points are asked in the follow-up. */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Work email">
                      <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@company.com"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Role">
                      {/* Native arrow hidden: browsers pin it to the edge; ours keeps the field's padding. */}
                      <div className="relative">
                        <select
                          name="role"
                          required
                          defaultValue=""
                          className={`${inputClass} cursor-pointer appearance-none pr-10`}
                        >
                          <option value="" disabled>
                            Select your role
                          </option>
                          {ROLES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                        <ChevronDown
                          aria-hidden
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        />
                      </div>
                    </Field>
                  </div>
                  <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                  {status.state === "error" && (
                    <p role="alert" className="rounded-md bg-alert-soft px-3 py-2.5 text-sm text-foreground">
                      We couldn&apos;t add you just now. Please try again, or email us at{" "}
                      <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
                        {SITE.email}
                      </a>
                      .
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status.state === "sending"}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 sm:px-6"
                  >
                    {status.state === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                      </>
                    ) : (
                      <>
                        Join the early-access list
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Mail className="h-3 w-3" /> We only use your details to contact you about SREnity.
                  </p>
                </form>
              )}
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
              <ul className="max-w-md divide-y divide-border border-y border-border">
                {PERKS.map(([title, text]) => (
                  <li key={title} className="flex gap-3 py-3.5 sm:py-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{title}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">{text}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                Questions first?{" "}
                <a href={`mailto:${SITE.email}`} className="text-foreground underline-offset-4 hover:underline">
                  {SITE.email}
                </a>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
