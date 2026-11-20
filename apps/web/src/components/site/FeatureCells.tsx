"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureCell = { index: string; title: string; body: ReactNode };

/**
 * From md: three cells side by side, all open. Below md: a stacked accordion, one cell open at a
 * time (the first to start), so the section stays short without sideways scrolling.
 */
export function FeatureCells({ cells }: { cells: FeatureCell[] }) {
  const [open, setOpen] = useState(0);
  const id = useId();

  return (
    <div className="bg-card max-md:divide-y max-md:divide-border max-md:overflow-hidden max-md:rounded-lg max-md:border max-md:border-border md:grid md:grid-cols-3 md:border-l md:border-t md:border-border">
      {cells.map((c, i) => {
        const isOpen = open === i;
        const bodyId = `${id}-${i}`;
        return (
          <div key={c.index} className="flex flex-col md:border-b md:border-r md:border-border md:p-8">
            {/* Phones/tablets: the title is the toggle. */}
            <h3 className="md:hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
              >
                <span className="label-mono shrink-0 text-muted-foreground">{c.index}</span>
                <span className="font-display flex-1 text-lg leading-snug text-foreground">{c.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180 text-signal",
                  )}
                />
              </button>
            </h3>

            {/* Desktop header */}
            <div className="max-md:hidden">
              <div className="label-mono text-muted-foreground">{c.index}</div>
              <h3 className="font-display mt-4 text-2xl text-foreground">{c.title}</h3>
            </div>

            <div
              id={bodyId}
              className={cn(
                "flex-1 text-sm leading-relaxed text-muted-foreground md:mt-3",
                isOpen ? "max-md:pop-in max-md:px-4 max-md:pb-5 sm:max-md:px-5" : "max-md:hidden",
              )}
            >
              {c.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
