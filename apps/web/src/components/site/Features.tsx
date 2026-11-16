import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import ParticlesBg from "@/components/ui/particles-bg";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { ContextEngine } from "./ContextEngine";
import { FeatureCells } from "./FeatureCells";

const connectors = ["ITSM tool", "Team chat", "Monitoring platform"];

const readers = [
  ["On-call engineer", "What has already been tried, and whether monitoring says it worked"],
  ["Next shift", "Who owns it now, where it stalled, and what is still open"],
  ["Managers", "The PIR report: root cause, time to resolve against the usual, and an owned action plan"],
];

const stats = [
  ["1 timeline", "every event cited to its source"],
  ["Every attempt", "checked against monitoring, not just what chat said"],
  ["1 PIR report", "with the RCA, lessons learned and an owned action plan"],
  ["0 guesses", "gaps in the records are flagged, never filled in"],
];

/** A tiny network map from the demo incident: the degraded link and what it took down with it. */
function BlastRadius() {
  const nodes = [
    { x: 44, y: 52, label: "branch-users", hit: true },
    { x: 170, y: 52, label: "wan-link", hit: true, origin: true },
    { x: 310, y: 18, label: "data-center", hit: false },
    { x: 310, y: 86, label: "service-desk", hit: true },
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [1, 3],
  ];
  return (
    <svg viewBox="0 0 380 110" className="mt-6 w-full max-w-md" aria-hidden>
      {edges.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a].x + 4}
          y1={nodes[a].y}
          x2={nodes[b].x - 4}
          y2={nodes[b].y}
          className={cn(
            "stroke-[1.25]",
            nodes[a].hit && nodes[b].hit ? "stroke-alert" : "stroke-border",
          )}
          strokeDasharray={nodes[a].hit && nodes[b].hit ? undefined : "3 3"}
        />
      ))}
      {nodes.map((n) => (
        <g key={n.label}>
          {n.origin && <circle cx={n.x} cy={n.y} r="11" className="fill-alert/15" />}
          <rect
            x={n.x - 4}
            y={n.y - 4}
            width="8"
            height="8"
            className={n.hit ? "fill-alert" : "fill-card stroke-muted-foreground"}
          />
          <text
            x={n.x}
            y={n.y + 20}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[9px] uppercase tracking-wider"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Features() {
  return (
    <section id="capabilities" className="tone-dark relative overflow-hidden scroll-mt-14 py-14 sm:py-20 md:scroll-mt-16 md:py-28">
      <ParticlesBg className="absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5">
        <SectionHeading
          index="02"
          label="What it does"
          title={
            <>
              One platform.{" "}
              <span className="text-muted-foreground">
                Every fact traced to its <span className="whitespace-nowrap">source.</span>
              </span>
            </>
          }
        >
          Tickets alone never tell the whole story. SREnity brings the ticket, work notes, team chat
          and monitoring alerts together, then builds one timeline where every fact points back to
          the record it came from.
        </SectionHeading>

        <Reveal delay={100} className="mt-8 sm:mt-12">
          <ContextEngine />
        </Reveal>

        <Reveal delay={150} className="mt-6">
          <FeatureCells
            cells={[
              {
                index: "02.2",
                title: "Plugs into the tools you run",
                body: (
                  <>
                    Read-only connections that follow the incident as responders work it. No CSVs, no
                    copy-paste, no new process for the on-call to learn.
                    <ul className="mt-5 divide-y divide-border border-y border-border">
                      {connectors.map((c) => (
                        <li key={c} className="flex items-center justify-between gap-3 py-2">
                          <span className="text-foreground">{c}</span>
                          <span className="label-mono inline-flex items-center gap-1 text-[10px] text-signal">
                            <Lock className="h-3 w-3" /> Read-only
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ),
              },
              {
                index: "02.3",
                title: "Keeps only what matters",
                body: (
                  <>
                    Ties the alert, the affected sites and the service-desk noise to the right ticket,
                    and leaves out repeats and unrelated chatter, so the timeline stays readable.
                    <BlastRadius />
                  </>
                ),
              },
              {
                index: "02.4",
                title: "One story, every reader",
                body: (
                  <ul className="space-y-3">
                    {readers.map(([who, what]) => (
                      <li key={who}>
                        <div className="label-mono text-signal">{who}</div>
                        <div className="mt-0.5">{what}</div>
                      </li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-8 grid grid-cols-2 border-y border-border sm:mt-10 lg:grid-cols-4">
            {stats.map(([v, l], i) => (
              <div
                key={l}
                className={cn(
                  "py-5 pr-4 sm:py-6",
                  i % 2 === 1 && "border-l border-border pl-5",
                  i > 0 && "lg:border-l lg:border-border lg:pl-6",
                  i >= 2 && "border-t border-border lg:border-t-0",
                )}
              >
                <div className="font-display whitespace-nowrap text-[22px] text-foreground sm:text-3xl lg:text-4xl">
                  {v}
                </div>
                <div className="mt-2 text-sm text-pretty text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
