"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Cloud, RotateCw } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import type { InstanceMenuItem } from "@/lib/incidentMenu";

type Incident = { sysId: string; number: string; shortDescription: string };
type Loaded = { key: string } & ({ state: "ready"; incidents: Incident[]; hasNext: boolean } | { state: "unavailable"; reauthorize?: boolean; message?: string });

const message = "px-2 py-1.5 text-xs leading-relaxed text-sidebar-foreground/70";

/**
 * One expandable group per saved ServiceNow instance. Incidents load only when a group is opened,
 * and a group that can't be reached says so instead of failing the whole menu.
 */
export function IncidentInstances({ instances, openIncident }: { instances: InstanceMenuItem[]; openIncident?: string }) {
  const [selected, setSelected] = useState(() => instances.find(item => item.selected)?.id);
  if (!instances.length) {
    return <div className="px-2">
      <p className={message}>No ServiceNow instances connected.</p>
      <Link href="/demo/connections?provider=servicenow" className={message + " block hover:underline"}>Manage ServiceNow connections</Link>
    </div>;
  }
  return <SidebarMenu>
    {instances.map(instance => <InstanceGroup key={instance.id} instance={instance} selected={instance.id === selected}
      openIncident={instance.id === selected ? openIncident : undefined} onSelect={() => setSelected(instance.id)} />)}
  </SidebarMenu>;
}

function InstanceGroup({ instance, selected, openIncident, onSelect }: {
  instance: InstanceMenuItem; selected: boolean; openIncident?: string; onSelect: () => void;
}) {
  const router = useRouter();
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(selected);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>();
  const [switching, setSwitching] = useState(false);
  const connected = instance.status === "connected";
  const key = [page, attempt, openIncident ?? ""].join(":");

  useEffect(() => {
    if (!open || !connected) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ all: "1", connection: instance.id, page: String(page), ...(openIncident ? { selected: openIncident } : {}) });
    fetch("/api/servicenow/incidents?" + query, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || (body.state !== "ready" && body.state !== "unavailable")) throw new Error("unavailable");
        return body as Omit<Loaded, "key">;
      })
      .catch(() => ({ state: "unavailable" as const }))
      .then(result => { if (!controller.signal.aborted) setLoaded({ key, ...result } as Loaded); });
    return () => controller.abort();
  }, [open, connected, instance.id, page, openIncident, key]);

  const revealIncident = useCallback((link: HTMLAnchorElement | null) => {
    const panel = link?.closest<HTMLElement>('[data-sidebar="content"]');
    if (!link || !panel) return;
    const item = link.getBoundingClientRect();
    const viewport = panel.getBoundingClientRect();
    if (item.top < viewport.top) panel.scrollTop += item.top - viewport.top;
    else if (item.bottom > viewport.bottom) panel.scrollTop += item.bottom - viewport.bottom;
  }, []);

  // Incident pages read the selected instance, so opening one from another group selects it first.
  async function openFromHere(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setOpenMobile(false);
    if (selected || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    setSwitching(true);
    try {
      const response = await fetch("/api/servicenow/select", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: instance.id }),
      });
      if (!response.ok) throw new Error("select failed");
      onSelect();
      router.push(href);
      router.refresh();
    } catch {
      setLoaded({ key, state: "unavailable" });
    } finally {
      setSwitching(false);
    }
  }

  const current = loaded?.key === key ? loaded : undefined;
  return <SidebarMenuItem>
    <SidebarMenuButton onClick={() => setOpen(value => !value)} aria-expanded={open} title={instance.host} className="pr-2">
      <ChevronRight className={"transition-transform " + (open ? "rotate-90" : "")} />
      <Cloud />
      <span className="truncate">{instance.host.replace(/\.service-now\.com$/, "")}</span>
      <span aria-label={connected ? "Connected" : "Reauthorization required"}
        className={"ml-auto size-1.5 shrink-0 rounded-full " + (connected ? "bg-signal" : "bg-alert")} />
    </SidebarMenuButton>
    {open && <SidebarMenuSub className="mr-0 pr-0">
      {!connected ? <SidebarMenuSubItem>
        <p role="alert" className={message}>This connection needs to be authorized again.</p>
        <Link href={"/demo/connections?add=servicenow&reconnect=" + instance.id + "#connection-setup"} className={message + " block font-semibold hover:underline"}>Reconnect</Link>
      </SidebarMenuSubItem>
      : !current ? <SidebarMenuSubItem><p role="status" className={message}>Loading incidents…</p></SidebarMenuSubItem>
      : current.state === "unavailable" ? <SidebarMenuSubItem>
        <p role="alert" className={message}>{current.reauthorize ? "This connection needs to be authorized again." : current.message || "Connection unavailable."}</p>
        {current.reauthorize
          ? <Link href={"/demo/connections?add=servicenow&reconnect=" + instance.id + "#connection-setup"} className={message + " block font-semibold hover:underline"}>Reconnect</Link>
          : <button type="button" onClick={() => setAttempt(value => value + 1)} className={message + " inline-flex items-center gap-1 font-semibold hover:underline"}><RotateCw size={12} /> Retry</button>}
      </SidebarMenuSubItem>
      : <>
        {current.incidents.map(incident => {
          const href = "/demo/incidents/" + incident.sysId;
          const active = selected && path === href;
          return <SidebarMenuSubItem key={incident.sysId}>
            <SidebarMenuButton asChild isActive={active} className="h-auto items-start py-2">
              <Link href={href} onClick={event => void openFromHere(event, href)} aria-current={active ? "page" : undefined}
                aria-disabled={switching || undefined} prefetch={false} ref={active ? revealIncident : undefined}
                className="flex flex-col gap-1" title={incident.shortDescription}>
                <span className="w-full text-xs font-semibold">{incident.number}</span>
                <span className="w-full truncate text-xs text-sidebar-foreground/75">{incident.shortDescription || "Untitled incident"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuSubItem>;
        })}
        {!current.incidents.length && <SidebarMenuSubItem><p className={message}>No incidents on this page.</p></SidebarMenuSubItem>}
        {(page > 1 || current.hasNext) && <SidebarMenuSubItem>
          <nav aria-label={instance.host + " incident pages"} className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
            {page > 1 && <button type="button" onClick={() => setPage(page - 1)} className="inline-flex items-center gap-1 hover:underline"><ArrowLeft size={13} /> Previous</button>}
            {current.hasNext && <button type="button" onClick={() => setPage(page + 1)} className="ml-auto inline-flex items-center gap-1 hover:underline">Next <ArrowRight size={13} /></button>}
          </nav>
        </SidebarMenuSubItem>}
      </>}
    </SidebarMenuSub>}
  </SidebarMenuItem>;
}
