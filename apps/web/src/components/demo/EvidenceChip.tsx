"use client";

import { Activity, Calculator, FileText, Gauge, GitBranch, Hash, History, Layers, MessageSquare, Network, PenLine, SearchX, Ticket, TriangleAlert, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";

/** What each evidence ID prefix points at, so a chip reads as "a note", "a chat message", not a code. */
const KINDS: Record<string, { icon: typeof Ticket; label: string }> = {
  T: { icon: Ticket, label: "Ticket" },
  N: { icon: PenLine, label: "Work note" },
  H: { icon: History, label: "Field change" },
  A: { icon: Activity, label: "Monitoring alert" },
  L: { icon: Gauge, label: "SLA record" },
  M: { icon: Hash, label: "Chat message" },
  G: { icon: TriangleAlert, label: "Missing source" },
  S: { icon: Calculator, label: "Computed from records" },
  O: { icon: Layers, label: "Other incident" },
  P: { icon: FileText, label: "Past incident" },
  R: { icon: MessageSquare, label: "Past incident note" },
  C: { icon: GitBranch, label: "Change request" },
  Q: { icon: SearchX, label: "Search that found nothing" },
  D: { icon: Network, label: "CMDB relationship" },
  X: { icon: Waypoints, label: "Traces" },
};

export function EvidenceChip({ id, active, onClick }: { id: string; active: boolean; onClick: () => void }) {
  const kind = KINDS[id[0]] ?? { icon: FileText, label: "Record" };
  const Icon = kind.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Show evidence: ${kind.label} ${id}`}
      title={`${kind.label} · click to see the source record`}
      className={cn(
        "inline-flex cursor-pointer items-center gap-0.5 rounded-full border px-1.5 py-px align-middle font-mono text-[10px] font-medium not-italic leading-4 shadow-sm transition-colors",
        active
          ? "border-signal bg-signal text-white"
          : "border-signal/35 bg-signal-soft text-signal hover:border-signal hover:bg-signal hover:text-white",
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {id}
    </button>
  );
}
