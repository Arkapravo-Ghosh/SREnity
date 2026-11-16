"use client";

import Link from "next/link";
import { Activity, Cloud, Hash, List } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import type { ConnectorConnection } from "@/lib/connector";
import type { InstanceMenuItem } from "@/lib/incidentMenu";
import { IncidentInstances } from "./IncidentInstances";

export const integrations = [
  { label: "All connections", id: "", icon: List },
  { label: "ServiceNow", id: "servicenow", icon: Cloud },
  { label: "Prometheus", id: "prometheus", icon: Activity },
  { label: "Slack", id: "slack", icon: Hash },
];

type Props = { kind: "connections" }
  | { kind: "metrics"; servers: ConnectorConnection[] | null }
  | { kind: "incidents"; state: "loading" | "unavailable" }
  | { kind: "incidents"; state: "ready"; instances: InstanceMenuItem[]; openIncident?: string };

export function WorkspaceMenu(props: Props) {
  const path = usePathname();
  const search = useSearchParams();
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);
  const messageClass = "px-2 py-2 text-xs leading-relaxed text-sidebar-foreground/70";

  if (props.kind === "connections") {
    const provider = path === "/demo/connections" ? search.get("provider") ?? search.get("add") ?? "" : "";
    return <SidebarGroup>
      <SidebarMenu>
        {integrations.map(({ id, label, icon: Icon }) => {
          const active = id === provider || (!id && provider === "choose");
          return <SidebarMenuItem key={id}>
            <SidebarMenuButton asChild isActive={active}>
              <Link href={id ? "/demo/connections?provider=" + id : "/demo/connections"}
                aria-current={active ? "page" : undefined} onClick={close}><Icon /><span>{label}</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>;
        })}
      </SidebarMenu>
    </SidebarGroup>;
  }

  if (props.kind === "metrics") {
    const selected = path === "/demo/prometheus" ? search.get("connection") : null;
    const allMetrics = path === "/demo/prometheus" && !selected;
    return <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">Prometheus servers</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem><SidebarMenuButton asChild isActive={allMetrics}>
          <Link href="/demo/prometheus" aria-current={allMetrics ? "page" : undefined} onClick={close}><List /><span>All Metrics</span></Link>
        </SidebarMenuButton></SidebarMenuItem>
        {props.servers?.map(server => <SidebarMenuItem key={server.id}>
          <SidebarMenuButton asChild isActive={server.id === selected}>
            <Link href={"/demo/prometheus?connection=" + server.id} aria-current={server.id === selected ? "page" : undefined}
              onClick={close} title={server.name}><Activity /><span>{server.name}</span></Link>
          </SidebarMenuButton>
        </SidebarMenuItem>)}
      </SidebarMenu>
      {!props.servers ? <p role="alert" className={messageClass}>Could not load Prometheus connections.</p>
        : !props.servers.length && <p className={messageClass}>No Prometheus servers connected.</p>}
      <Link href="/demo/connections?provider=prometheus" onClick={close} className={messageClass + " hover:underline"}>Manage Prometheus connections</Link>
    </SidebarGroup>;
  }

  return <SidebarGroup>
    <SidebarMenu className="sticky top-0 z-10 mb-2 bg-sidebar">
      <SidebarMenuItem><SidebarMenuButton asChild isActive={path === "/demo"}>
        <Link href="/demo" aria-current={path === "/demo" ? "page" : undefined} onClick={close}><List /><span>All Incidents</span></Link>
      </SidebarMenuButton></SidebarMenuItem>
    </SidebarMenu>
    <SidebarGroupLabel className="text-sidebar-foreground/70">ServiceNow instances</SidebarGroupLabel>
    {props.state === "ready" ? <IncidentInstances instances={props.instances} openIncident={props.openIncident} />
      : <p className={messageClass} role={props.state === "unavailable" ? "alert" : "status"}>
        {props.state === "unavailable" ? "Could not load ServiceNow instances. Refresh to try again." : "Loading instances…"}
      </p>}
  </SidebarGroup>;
}
