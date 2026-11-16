import { Check, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import ParticlesBg from "@/components/ui/particles-bg";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/*
 * Every statement here must match the architecture in /tech (claim verification, security and
 * pilot acceptance docs) or a policy the founders have confirmed (no training on customer data).
 * Pre-launch, so these are design commitments: no certifications, no accuracy numbers, nothing
 * the build doesn't promise.
 */

const CHECKS = [
  {
    title: "Quoted",
    text: "Each line carries the exact passage of the work note, chat message or alert it came from. The quote is checked against the source text; a mismatch removes the line.",
  },
  {
    title: "Checked",
    text: "Names, numbers, units and times are compared with the source. A line can't say 4% loss when the evidence says 2.6%.",
  },
  {
    title: "Conflicts kept",
    text: "When two notes disagree, both are shown and cited. SREnity never quietly picks the newest note as the truth.",
  },
  {
    title: "Verified",
    text: "Every action is marked as worked, did not work or unclear, based on what monitoring showed afterwards, not on what someone said in chat.",
  },
];

const SAFEGUARDS = [
  {
    title: "Read-only by design",
    text: "Connections can only read, never write. Each credential is used for a single connection and nothing else.",
  },
  {
    title: "Never acts on its own",
    text: "SREnity cannot change infrastructure, tickets or configuration, and nothing written inside a ticket or chat can make it.",
  },
  {
    title: "Isolated per customer",
    text: "Every customer's data is kept separate. Files sit in private, encrypted storage that belongs to that customer alone.",
  },
  {
    title: "Sensitive data protected",
    text: "Sensitive fields are redacted before analysis. Where your data is processed is fixed per deployment and never switched silently.",
  },
  {
    title: "Logs without your content",
    text: "Operational logs hold IDs and status, never notes, messages or secrets. Our operators have no standing access to incident content.",
  },
  {
    title: "Retention you set",
    text: "Retention is configured per customer. Deletion removes the data and its cached copies, and leaves a receipt with no content in it.",
  },
];

const PILOT = [
  ["Against your baseline", "We measure how long catching up on an incident and handing it over takes, against how long it takes your team today."],
  ["On your own incidents", "20–50 of your historical incidents first, then live incidents where you allow it."],
  ["Reported with limits", "Results come with sample size and caveats. Any manual help from us is logged, not passed off as automation."],
];

type Verdict = "supported" | "contradicted" | "unverifiable";

const VERDICT_STYLE: Record<Verdict, string> = {
  supported: "bg-signal-soft text-signal",
  contradicted: "bg-alert-soft text-alert",
  unverifiable: "bg-muted text-muted-foreground",
};

/** A worked example of the claim checks on two conflicting work notes. */
function ClaimCheck() {
  const claims: { text: string; verdict: Verdict; why: string }[] = [
    { text: "DNS caused the outage", verdict: "contradicted", why: "[2] says DNS checks passed" },
    { text: "The carrier caused the outage", verdict: "unverifiable", why: "[2] says the carrier is still investigating" },
    { text: "The DNS suspicion wasn't supported by later checks", verdict: "supported", why: "Cites [1] and [2]" },
  ];
  return (
    <div className="tone-light rounded-xl border border-border bg-card p-4 text-foreground shadow-[0_24px_48px_-20px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="label-mono text-muted-foreground">Example · two work notes</div>
      <ol className="mt-3 space-y-2 font-mono text-xs">
        <li className="flex gap-3 rounded-md bg-background px-3 py-2">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">[1] 10:00</span>
          <span>“Suspect DNS.”</span>
        </li>
        <li className="flex gap-3 rounded-md bg-background px-3 py-2">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">[2] 10:15</span>
          <span>“DNS checks passed; carrier investigating loss.”</span>
        </li>
      </ol>

      <div className="label-mono mt-5 text-muted-foreground">Claims, checked</div>
      <ul className="mt-2 divide-y divide-border border-y border-border">
        {claims.map((c) => (
          <li key={c.text} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="text-sm">{c.text}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.why}</div>
            </div>
            <span className={cn("label-mono shrink-0 rounded px-1.5 py-0.5 text-[10px]", VERDICT_STYLE[c.verdict])}>
              {c.verdict}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-l-2 border-signal bg-signal-soft px-3.5 py-3">
        <div className="label-mono text-signal">What gets published</div>
        <p className="mt-1.5 text-sm leading-relaxed">
          The initial DNS suspicion was not supported by later checks; the carrier was still
          investigating packet{" "}
          <span className="whitespace-nowrap">
            loss. <span className="font-mono text-xs text-muted-foreground">[1][2]</span>
          </span>
        </p>
      </div>
    </div>
  );
}

export function Trust() {
  return (
    <section id="trust" className="tone-dark relative overflow-hidden scroll-mt-14 py-14 sm:py-20 md:scroll-mt-16 md:py-28">
      <ParticlesBg className="absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5">
        <SectionHeading
          index="04"
          label="Evidence & trust"
          title={
            <>
              <span className="block">Every fact checked.</span>{" "}
              <span className="block text-muted-foreground">Every connection read-only.</span>
            </>
          }
        >
          SREnity is built to be audited, not taken on faith. Here is how a line earns the right to
          state something as fact, and what the platform is designed never to do with your data.
        </SectionHeading>

        {/* How a claim gets published */}
        <div className="mt-8 grid gap-8 sm:mt-12 sm:gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <h3 className="font-display text-xl text-foreground sm:text-2xl">How a claim gets published</h3>
            <ol className="mt-4 divide-y divide-border border-y border-border sm:mt-6">
              {CHECKS.map((c, i) => (
                <li key={c.title} className="grid grid-cols-[2rem_1fr] gap-x-2 py-3.5 sm:grid-cols-[2.5rem_1fr] sm:py-4">
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                  <div>
                    <div className="font-medium text-foreground">{c.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
              <span>
                A claim that fails a check is not published as fact. It becomes a visible
                “unknown” or “conflict” note instead.
              </span>
            </p>
          </Reveal>
          <Reveal delay={120} className="lg:pt-14">
            <ClaimCheck />
          </Reveal>
        </div>

        {/* Data safeguards */}
        <Reveal className="mt-14 sm:mt-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h3 className="font-display text-xl text-foreground sm:text-2xl">Built for a security review</h3>
            <a
              href={`mailto:${SITE.email}?subject=${encodeURIComponent("SREnity security questions")}`}
              className="-my-1.5 inline-flex items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" /> Security questions? {SITE.email}
            </a>
          </div>
          <div className="mt-5 grid border-l border-t border-border sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {SAFEGUARDS.map((s) => (
              <div key={s.title} className="border-b border-r border-border p-4 sm:p-6">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-signal" strokeWidth={2.5} />
                  {s.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Pilot measurement */}
        <Reveal className="mt-14 sm:mt-20">
          <h3 className="font-display text-xl text-foreground sm:text-2xl">No accuracy claims until pilots earn them</h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            We won&apos;t quote a success rate we haven&apos;t measured. Every pilot is scored the same
            way:
          </p>
          <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 md:grid-cols-3">
            {PILOT.map(([title, text]) => (
              <div key={title} className="border-t-2 border-signal pt-4">
                <div className="font-medium text-foreground">{title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
