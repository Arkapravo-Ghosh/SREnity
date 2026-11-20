"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, RefreshCw } from "lucide-react";
import type { IncidentSummary } from "@/lib/servicenow/incidents";
import { cn } from "@/lib/utils";
import { formatOpened, isClosed, priorityLabel } from "./presentation";

export function IncidentList({ incidents, instance, page, hasNext }: {
  incidents: IncidentSummary[];
  instance: string;
  page: number;
  hasNext: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const retry = () => startTransition(() => router.refresh());
  const pageUrl = (index: number) => index === 1 ? "/demo" : "/demo?page=" + index;

  if (incidents.length === 0 && page === 1) {
    return (
      <div className="rounded-lg border border-border bg-card/60 px-6 py-10 text-center">
        <p className="text-sm text-foreground">No incidents on {instance}.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          ServiceNow returns the incidents your account has permission to view.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 sm:px-5 sm:py-3">
        <span className="label-mono text-muted-foreground">
          {incidents.length} {incidents.length === 1 ? "incident" : "incidents"} on this page
        </span>
        <button
          onClick={retry}
          disabled={pending}
          className="-my-1.5 -mr-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-secondary/60"
        >
          <RefreshCw className="h-3 w-3" /> {pending ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* A table on wide screens, cards on narrow ones: the same data, read two ways. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="label-mono px-5 py-2.5 font-medium">
                Number
              </th>
              <th scope="col" className="label-mono px-5 py-2.5 font-medium">
                Opened
              </th>
              <th scope="col" className="label-mono px-5 py-2.5 font-medium">
                Short description
              </th>
              <th scope="col" className="label-mono px-5 py-2.5 text-right font-medium">
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr
                key={incident.sysId}
                className="group border-b border-border last:border-b-0 hover:bg-secondary/60"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/demo/incidents/${incident.sysId}${page > 1 ? "?page=" + page : ""}`} prefetch={false}
                    className="inline-flex items-center gap-1.5 font-mono text-sm text-signal hover:underline"
                  >
                    {incident.number}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                  {formatOpened(incident.openedAt)}
                </td>
                <td className="px-5 py-3 text-sm text-foreground">{incident.shortDescription}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <PriorityPill incident={incident} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border lg:hidden">
        {incidents.map((incident) => (
          <li key={incident.sysId}>
            <Link href={`/demo/incidents/${incident.sysId}${page > 1 ? "?page=" + page : ""}`} prefetch={false} className="block px-4 py-3 active:bg-secondary/60 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="font-mono text-[13px] text-signal sm:text-sm">{incident.number}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{formatOpened(incident.openedAt)}</span>
                </span>
                <PriorityPill incident={incident} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-foreground">{incident.shortDescription || "Untitled incident"}</p>
            </Link>
          </li>
        ))}
      </ul>
      {(page > 1 || hasNext) && <nav aria-label="Incident list pages" className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2 text-sm sm:gap-4 sm:px-5 sm:py-3">
        <span className="mr-auto text-muted-foreground">Page {page}</span>
        {page > 1 && <Link href={pageUrl(page - 1)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 hover:underline active:bg-secondary/60"><ArrowLeft size={14} /> Previous</Link>}
        {hasNext && <Link href={pageUrl(page + 1)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 hover:underline active:bg-secondary/60">Next <ArrowRight size={14} /></Link>}
      </nav>}
    </div>
  );
}

function PriorityPill({ incident }: { incident: IncidentSummary }) {
  const closed = isClosed(incident.stateCode);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="label-mono text-muted-foreground">{priorityLabel(incident.priority)}</span>
      <span
        className={cn(
          "label-mono rounded px-1.5 py-1",
          closed ? "bg-signal-soft text-signal" : "bg-alert-soft text-alert",
        )}
      >
        {incident.state || (closed ? "Closed" : "Open")}
      </span>
    </span>
  );
}
