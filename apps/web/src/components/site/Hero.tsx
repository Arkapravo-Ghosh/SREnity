import { ArrowRight, Check } from "lucide-react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import ParticlesBg from "@/components/ui/particles-bg";
import { HeroConsole } from "./HeroConsole";
import { HeroStory } from "./HeroStory";

/** Guarantees, not outcome numbers: those come from pilots, measured against each team's baseline. */
const stats = [
  { value: "Cited", label: "Every line" },
  { value: "Read-only", label: "Every connection" },
  { value: "Flagged", label: "Every gap" },
];

const enter = (delay: number) => ({
  animation: `ticker-up 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
});

export function Hero() {
  return (
    <section id="top" className="tone-dark relative overflow-hidden pt-22 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24">
      <ParticlesBg className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      {/* Two columns only from xl: any narrower and the console's callout cards overlap. */}
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 sm:gap-12 xl:grid-cols-[0.92fr_1.08fr] xl:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-3" style={enter(0.05)}>
            <a
              href="#early-access"
              className="label-mono inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal-soft px-3 py-1.5 text-signal transition-colors hover:border-signal"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              Coming soon
            </a>
            <span className="label-mono text-muted-foreground">{SITE.tagline}</span>
          </div>

          <h1
            className="font-display mt-5 text-[38px] leading-[1.03] text-foreground sm:mt-6 sm:text-6xl xl:text-[58px]"
            style={enter(0.15)}
          >
            {/* One sentence per block, so a line never ends on the next sentence's first word. */}
            <span className="block">Fragmented Data</span>{" "}
            <span className="block text-muted-foreground">to Incident Clarity</span>
          </h1>

          <p
            className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg"
            style={enter(0.3)}
          >
            An incident&rsquo;s story is scattered across the ticket, work notes, team chat and
            monitoring. SREnity turns it into one timeline anyone can pick up in a minute: what
            happened, what&rsquo;s already been tried and whether it worked, who owns it, and how
            similar incidents were fixed before. Every line links back to{" "}
            <span className="whitespace-nowrap">its source.</span>
          </p>

          {/* Phones: both CTAs on one row. */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:flex-row sm:flex-wrap sm:gap-3" style={enter(0.45)}>
            <a
              href="#early-access"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-6"
            >
              Get early access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 max-sm:hidden" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-foreground/25 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/60 sm:px-6"
            >
              <span className="sm:hidden">See the demo</span>
              <span className="max-sm:hidden">Watch it work an incident</span>
            </a>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground sm:mt-4 sm:text-sm" style={enter(0.5)}>
            Early sign-ups get a founding-team discount and a priority pilot slot.
          </p>

          {/* Phones: a short checklist. From sm: three columns. */}
          <ul className="mt-6 space-y-1.5 border-t border-border pt-4 sm:hidden" style={enter(0.6)}>
            {stats.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 shrink-0 text-signal" strokeWidth={2.5} />
                <span className="text-muted-foreground">
                  <span className="text-foreground">{s.value}</span> · {s.label.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 grid max-w-md grid-cols-3 border-t border-border max-sm:hidden" style={enter(0.6)}>
            {stats.map((s, i) => (
              <div key={s.label} className={cn("pt-4", i > 0 ? "border-l border-border pl-4" : "pr-4")}>
                <div className="font-display text-2xl text-foreground">{s.value}</div>
                <div className="label-mono mt-1 text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phones get the incident as a short timeline; from sm, the interactive loop with callouts. */}
        <div style={enter(0.35)}>
          <HeroStory className="sm:hidden" />
          <div className="max-sm:hidden">
            <HeroConsole />
          </div>
        </div>
      </div>
    </section>
  );
}
