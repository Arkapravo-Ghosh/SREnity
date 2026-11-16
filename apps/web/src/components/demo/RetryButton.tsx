"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Re-runs the server render of the current page (e.g. after ServiceNow had a transient error). */
export function RetryButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => router.refresh())}
      className={cn("inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50", className)}>
      <RotateCw className={cn("h-3 w-3", pending && "animate-spin")} /> {pending ? "Retrying…" : "Retry"}
    </button>
  );
}
