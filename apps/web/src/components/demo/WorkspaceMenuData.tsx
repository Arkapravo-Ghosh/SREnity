"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { WorkspaceMenu } from "./WorkspaceMenu";

type Menu = ComponentProps<typeof WorkspaceMenu>;
type Section = "incidents" | "metrics";

export function WorkspaceMenuData({ section, selected }: { section: Section; selected?: string }) {
  const key = section;
  const [loaded, setLoaded] = useState<{ key: string; data: Menu }>();
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = section === "incidents"
      ? "/api/servicenow/instances"
      : "/api/prometheus/connections";
    async function load() {
      let data: Menu;
      try {
        const response = await fetch(endpoint, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Menu unavailable");
        const result = await response.json();
        data = section === "incidents" ? { kind: section, state: "ready", instances: result.instances } : {
          kind: section, servers: result.connections.filter((row: { status: string }) => row.status === "connected"),
        };
      } catch {
        data = section === "incidents" ? { kind: section, state: "unavailable" } : { kind: section, servers: null };
      }
      if (!controller.signal.aborted) setLoaded({ key, data });
    }
    void load();
    return () => controller.abort();
  }, [key, section]);
  if (loaded?.key !== key) {
    return section === "incidents" ? <WorkspaceMenu kind="incidents" state="loading" />
      : <p role="status" className="px-4 py-3 text-sm text-sidebar-foreground/75">Loading…</p>;
  }
  // The open incident changes on navigation; the instance list itself doesn't need reloading.
  return <WorkspaceMenu {...loaded.data} {...(loaded.data.kind === "incidents" && loaded.data.state === "ready" ? { openIncident: selected } : {})} />;
}
