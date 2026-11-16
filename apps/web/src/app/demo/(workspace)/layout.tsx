import { Suspense, type ReactNode } from "react";
import type { Viewport } from "next";
import { cookies } from "next/headers";
import { WorkspaceNavigation } from "@/components/demo/WorkspaceNavigation";
import { SidebarProvider } from "@/components/ui/sidebar";

// Lets the bottom tab bar pad itself clear of the iPhone home indicator.
export const viewport: Viewport = { themeColor: "#0b2a38", viewportFit: "cover" };

export default function Layout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-svh bg-background" />}><Workspace>{children}</Workspace></Suspense>;
}

async function Workspace({ children }: { children: ReactNode }) {
  const store = await cookies();
  return (
    <SidebarProvider defaultOpen={store.get("sidebar_state")?.value !== "false"} className="demo-workspace bg-background text-foreground">
      <Suspense><WorkspaceNavigation>{children}</WorkspaceNavigation></Suspense>
    </SidebarProvider>
  );
}
