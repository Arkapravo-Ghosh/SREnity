import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    title: "Connect",
    text: "Give SREnity read-only access to your ticketing system, team chat and monitoring. It picks up incidents the moment they open.",
    meta: "Read-only · scoped access",
  },
  {
    title: "Piece it together",
    text: "SREnity reads the ticket, work notes, chat and alerts, and builds the real story: what happened, who owned it, what was tried and whether it worked. Gaps and contradictions are flagged, never guessed.",
    meta: "Every fact cited to a source",
  },
  {
    title: "Hand over",
    text: "The next person on shift opens one timeline instead of five tools, alongside similar past incidents and how they were fixed. When it is over, the PIR report is ready. Nothing is posted or changed on your behalf.",
    meta: "Timeline · history · PIR",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-14 py-14 sm:py-20 md:scroll-mt-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading index="03" label="How it works" title="Three steps, zero ceremony" />

        <div className="mt-8 grid sm:mt-12 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div className="h-full border-t-2 border-foreground pt-5 sm:pt-6">
                <div className="font-mono text-sm text-muted-foreground">0{i + 1}</div>
                <h3 className="font-display mt-3 text-2xl text-foreground sm:mt-6">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                <div className={cn("label-mono mt-4 text-balance text-signal sm:mt-6", i < steps.length - 1 && "pb-8 sm:pb-10 md:pb-0")}>
                  {s.meta}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
