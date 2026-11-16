import { Plus } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/** Also published as FAQPage structured data, so keep answers plain text. */
export const FAQS = [
  {
    q: "When does SREnity launch?",
    a: "We're onboarding a small group of pilot teams first, with general availability to follow. Join the early-access list and you'll hear from us before anyone else.",
  },
  {
    q: "What do early sign-ups get?",
    a: "A founding-team discount on your first year, a priority pilot slot run on your own incidents, and a direct say in which integrations we build next.",
  },
  {
    q: "Who is SREnity for?",
    a: "IT operations teams, network operations centres, MSPs and SRE teams who work long-running incidents across shifts and need anyone to pick one up without a 30-minute catch-up.",
  },
  {
    q: "Which tools does it work with?",
    a: "SREnity connects read-only to your ITSM or ticketing system (ServiceNow today), your team chat (Slack today, Microsoft Teams next) and monitoring such as alerts and metrics. Tell us your stack when we follow up on your sign-up; it decides which connectors ship next.",
  },
  {
    q: "Does SREnity change anything?",
    a: "No. Access is read-only, so it never posts messages or changes your network, your tickets or your configuration. It shows your team the full picture; your team decides what to do.",
  },
  {
    q: "Is our data used for training?",
    a: "No. Your incidents are used only to build your own timelines and analysis. They are never used for training of any kind, and never shared with another customer.",
  },
  {
    q: "How is our incident data protected?",
    a: "Connections are read-only. Each customer's data is isolated, sensitive fields are redacted before analysis, logs carry no incident content, and retention is set per customer.",
  },
  {
    q: "How do I know the timeline is accurate?",
    a: "Every line links to the exact work note, chat message, alert or record it came from. When evidence is missing or contradicts itself, SREnity says so instead of guessing.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14 py-14 sm:py-20 md:scroll-mt-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading index="05" label="FAQ" title="Before you sign up">
          What teams ask us most while SREnity is in early access. Anything else, ask us at the
          address below.
        </SectionHeading>

        <Reveal delay={100} className="mt-6 sm:mt-10">
          <div className="divide-y divide-border border-y border-border">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left sm:gap-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="font-display text-[17px] leading-snug text-foreground sm:text-xl sm:leading-7">{q}</h3>
                  <Plus className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
                </summary>
                <p className="-mt-1 max-w-3xl pb-5 text-[15px] leading-relaxed text-muted-foreground sm:-mt-2">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
