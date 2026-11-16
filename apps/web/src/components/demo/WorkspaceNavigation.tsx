"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, Cable, FileText, ListTree, PanelLeft, Plus, UserRound, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SREnityMark } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { integrations, WorkspaceMenu } from "./WorkspaceMenu";
import { WorkspaceMenuData } from "./WorkspaceMenuData";

const sections = [
  { label: "Connections", path: "/demo/connections", icon: Cable },
  { label: "Incidents", path: "/demo", icon: FileText },
  { label: "Metrics", path: "/demo/prometheus", icon: Activity },
] as const;
type Section = (typeof sections)[number];
const profile = { label: "Profile settings", path: "/demo/profile", icon: UserRound };
const shortLabel: Record<string, string> = { "/demo/connections": "Connections", "/demo": "Incidents", "/demo/prometheus": "Metrics", "/demo/profile": "Profile" };
const tabLink = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium leading-none text-sidebar-foreground/65 active:bg-sidebar-accent aria-[current=page]:text-sidebar-primary aria-expanded:text-sidebar-primary";
const railLink = "grid size-9 place-items-center rounded-md text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-primary";

export function WorkspaceNavigation({ children }: { children: ReactNode }) {
  const path = usePathname();
  const search = useSearchParams();
  const { setOpenMobile, openMobile, open, toggleSidebar } = useSidebar();
  // Read the breakpoint here rather than from the sidebar context. The provider hydrates in an
  // outer boundary and has already switched to the client value by the time this boundary
  // hydrates, which made the server and client trees disagree on phones.
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<Section | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const section = [...sections, profile].find(item => item.path === path) ?? sections[1];
  const activeProvider = section === sections[0] ? search.get("provider") ?? search.get("add") : null;
  const provider = integrations.find(item => item.id === activeProvider);
  const hasMenu = section !== profile;
  const hasPinnedMenu = hasMenu && open;
  const preview = !hasPinnedMenu && !isMobile ? hovered : null;
  const sidebarTitle = preview?.label ?? section.label;
  const menuSection = preview ?? section;
  const incidentId = path.startsWith("/demo/incidents/") ? path.split("/").at(-1) : undefined;
  const sidebarMenu = menuSection === sections[0] ? <WorkspaceMenu kind="connections" />
    : menuSection === sections[1] ? <WorkspaceMenuData section="incidents" selected={incidentId} />
    : menuSection === sections[2] ? <WorkspaceMenuData section="metrics" /> : null;

  function cancelDismiss() {
    if (dismissTimer.current !== null) clearTimeout(dismissTimer.current);
  }
  function dismissPreview() {
    cancelDismiss();
    setHovered(null);
  }
  function showPreview(item: Section) {
    if (hasPinnedMenu || isMobile) return;
    cancelDismiss();
    setHovered(item);
  }
  function scheduleDismiss() {
    cancelDismiss();
    dismissTimer.current = setTimeout(() => setHovered(null), 150);
  }
  function toggle() {
    dismissPreview();
    toggleSidebar();
  }
  useEffect(() => () => {
    if (dismissTimer.current !== null) clearTimeout(dismissTimer.current);
  }, []);

  const railItems = (mobile: boolean) => sections.map(item => {
    const { label, path: href, icon: Icon } = item;
    const current = section.path === href ? "page" : undefined;
    if (mobile) return <Link key={href} href={href} aria-current={current} className={tabLink}
      onClick={() => setOpenMobile(false)}><Icon size={19} aria-hidden />{shortLabel[href]}</Link>;
    return <Link key={href} href={href} aria-label={label} title={label} aria-current={current}
      className={railLink} onClick={dismissPreview}
      onPointerEnter={event => { if (event.pointerType === "mouse") showPreview(item); }}
      onPointerLeave={scheduleDismiss}><Icon size={18} /></Link>;
  });
  const profileLink = (mobile: boolean) => {
    if (mobile) return <Link href={profile.path} aria-current={section === profile ? "page" : undefined} className={tabLink}
      onClick={() => setOpenMobile(false)}><UserRound size={19} aria-hidden />Profile</Link>;
    const link = <Link href={profile.path} aria-label={profile.label}
      aria-current={section === profile ? "page" : undefined} className={railLink}
      onPointerEnter={dismissPreview} onClick={dismissPreview}><UserRound size={18} /></Link>;
    return <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{profile.label}</TooltipContent>
    </Tooltip>;
  };
  const menuButton = (mobile: boolean) => {
    // On phones this opens the current section's list (incidents, servers, providers).
    if (mobile) return <button type="button" aria-expanded={openMobile} aria-label={"Browse " + section.label.toLowerCase()}
      onClick={toggle} className={tabLink}><ListTree size={19} aria-hidden />Browse</button>;
    const expanded = open;
    const label = expanded ? "Collapse Sidebar" : "Expand Sidebar";
    const button = <Button type="button" variant="ghost" size="icon"
      aria-expanded={expanded} aria-label={label} onClick={toggle}
      onPointerEnter={dismissPreview}
      className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"><PanelLeft /></Button>;
    return <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
    </Tooltip>;
  };

  return <>
    <div className="sticky top-0 z-30 hidden h-svh shrink-0 self-start md:flex"
      onPointerLeave={scheduleDismiss}
      onKeyDown={event => {
        if (event.key === "Escape" && preview) {
          event.currentTarget.querySelector<HTMLElement>("nav a[aria-current=page]")?.focus();
          dismissPreview();
        }
      }}>
      <nav aria-label="Workspace shortcuts" className="flex h-full w-14 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar px-2 py-3 text-sidebar-foreground">
        <Link href="/demo/connections" aria-label="SREnity workspace" onPointerEnter={dismissPreview} className="tone-dark mb-3 grid size-9 place-items-center rounded-lg bg-sidebar-accent text-sidebar-primary">
          <SREnityMark className="w-6" />
        </Link>
        {railItems(false)}
        <div className="mt-auto flex flex-col items-center gap-1">
          {menuButton(false)}
          {profileLink(false)}
        </div>
      </nav>
      {!isMobile && (hasPinnedMenu || preview) &&
        <div className={preview ? "absolute bottom-3 left-full top-3 pl-2" : "h-full border-r border-sidebar-border"}
          onPointerEnter={cancelDismiss} onPointerLeave={scheduleDismiss}>
          <Sidebar collapsible="none" aria-label={sidebarTitle + " menu"}
            className={preview ? "max-h-full overflow-hidden rounded-xl border border-sidebar-border shadow-2xl" : ""}>
            <SidebarHeader className="px-4 py-4"><h2 className="font-display text-lg font-semibold">{sidebarTitle}</h2></SidebarHeader>
            <SidebarContent>{sidebarMenu}</SidebarContent>
          </Sidebar>
        </div>}
    </div>

    {isMobile && hasMenu && <Sidebar collapsible="offcanvas">
      <SidebarHeader className="flex-row items-center justify-between gap-3 px-4 py-4">
        <h2 className="font-display text-lg font-semibold">{section.label}</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close navigation" onClick={() => setOpenMobile(false)} className="hover:bg-sidebar-accent hover:text-sidebar-foreground"><X /></Button>
      </SidebarHeader>
      <SidebarContent>{sidebarMenu}</SidebarContent>
    </Sidebar>}

    <div className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-10 flex h-12 items-center gap-2.5 border-b border-border bg-card px-4 sm:h-[3.25rem] sm:gap-3 sm:px-6">
        <Link href="/demo/connections" aria-label="SREnity workspace" className="tone-dark grid size-7 shrink-0 place-items-center rounded-md bg-sidebar text-sidebar-primary md:hidden">
          <SREnityMark className="w-[1.1rem]" />
        </Link>
        <span className="truncate text-sm font-semibold">{provider?.id ? provider.label : section.label}</span>
        {section === sections[0] && <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
          <Link href={"/demo/connections?add=" + (provider?.id || "choose") + (provider?.id ? "#connection-setup" : "")}>
            <Plus data-icon="inline-start" /> <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add connection</span>
          </Link>
        </Button>}
      </header>
      {children}
    </div>

    <nav aria-label="Mobile workspace shortcuts" className={cn("fixed inset-x-0 bottom-0 z-20 flex items-stretch gap-1 border-t border-sidebar-border bg-sidebar px-2 pt-1.5 text-sidebar-foreground md:hidden",
      "pb-[max(0.375rem,env(safe-area-inset-bottom))]")}>
      {railItems(true)}
      {hasMenu && menuButton(true)}
      {profileLink(true)}
    </nav>
  </>;
}
