import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** “double”, "straight", ‘single’ and 'quoted' spans; apostrophes inside words (don't) are left alone. */
const QUOTED = /(“[^”]{2,}”|"[^"]{2,}"|‘[^’]{2,}’|(?<=^|[\s(:])'[^'\n]{2,}'(?=$|[\s.,;:)!?]))/g;

export const quoteStyle = "rounded bg-signal-soft/70 px-1 font-serif italic text-foreground";

/** Text with every directly quoted log line or chat message set apart, so the reader sees what is verbatim. */
export function Quoted({ text, className }: { text: string; className?: string }) {
  const parts = text.split(QUOTED);
  return (
    <span className={className}>
      {parts.map((part, n) =>
        n % 2 === 1 ? <span key={n} className={quoteStyle}>{part}</span> : <Fragment key={n}>{part}</Fragment>,
      )}
    </span>
  );
}

/** A standalone quote block (an exact excerpt of a record). */
export function QuoteBlock({ text, children, className }: { text: string; children?: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mt-1 border-l-2 border-signal/50 pl-2 text-[13px]", className)}>
      <span className={quoteStyle}>“{text}”</span>
      {children}
    </p>
  );
}
