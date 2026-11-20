/** Site-wide facts shared by metadata, structured data, the sitemap and the page itself. */
export const SITE = {
  name: "SREnity",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.srenity.tech").replace(/\/$/, ""),
  email: "contact@srenity.tech",
  tagline: "Evidence-backed incident context",
  title: "SREnity — Fragmented Data to Incident Clarity",
  description:
    "SREnity brings the ticket, work notes, team chat and monitoring alerts behind an IT incident into one evidence-backed timeline: what happened, what has already been tried and whether it worked, who owns it, where it stalled, how similar incidents were fixed before, and the PIR report. Every line links to the record it came from. Coming soon: join the early-access list.",
  /** Bump when the page content changes, so the sitemap reports a real modification date. */
  lastModified: "2026-11-14",
} as const;

/** In-page sections, shared by the navbar and footer. */
export const NAV_LINKS = [
  { label: "Demo", href: "#demo" },
  { label: "What it does", href: "#capabilities" },
  { label: "How it works", href: "#how" },
  { label: "Trust", href: "#trust" },
  { label: "FAQ", href: "#faq" },
] as const;
