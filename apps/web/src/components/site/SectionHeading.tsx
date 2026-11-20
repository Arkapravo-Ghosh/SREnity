import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/** Editorial section header: numbered mono label, headline left, supporting copy right. */
export function SectionHeading({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Reveal>
      <div className="border-t border-border pt-5 sm:pt-6">
        <div className="label-mono flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 bg-signal" />
          {index} · {label}
        </div>
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-[1.15fr_1fr] md:gap-16">
          <h2 className="font-display text-3xl leading-[1.08] text-foreground sm:text-[44px]">
            {title}
          </h2>
          {children && (
            <div className="text-[15px] leading-relaxed text-muted-foreground md:pt-2 md:text-base">
              {children}
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
