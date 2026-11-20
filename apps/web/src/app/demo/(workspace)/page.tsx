import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { readUser } from "@/lib/connector";
import { readConnection } from "@/lib/servicenow/session";
import { incidentPage, readAllIncidents } from "@/lib/incidentMenu";
import { IncidentList } from "@/components/demo/IncidentList";
import { RetryButton } from "@/components/demo/RetryButton";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "Connect your own ServiceNow instance and watch SREnity read the incidents your account can see.",
  // A demo behind an authenticated connection has nothing to offer a crawler.
  robots: { index: false, follow: false },
};

/**
 * The connection lives in a cookie, so this route is never static. Everything that reads it sits
 * inside one Suspense boundary, which is what lets the shell around it still prerender.
 *
 * The shell itself is rendered once, outside the boundary. Putting a second one in the fallback
 * leaves two <main> elements in the DOM while the boundary resolves.
 */
export default function DemoPage(props: PageProps<"/demo">) {
  return (
    <Suspense fallback={<DemoSkeleton />}>
      <DemoBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function DemoBody({ searchParams }: Pick<PageProps<"/demo">, "searchParams">) {
  const user = await readUser();
  if (!user) redirect("/demo/login");
  const params = await searchParams;
  if (params.connections === "1" || params.error || params.slackError || params.slackStatus) {
    const query = new URLSearchParams();
    for (const key of ["error", "slackError", "slackStatus"] as const) {
      if (typeof params[key] === "string") query.set(key, params[key]);
    }
    redirect("/demo/connections" + (query.size ? "?" + query.toString() : ""));
  }
  const page = incidentPage(params.page);
  const [connection, result] = await Promise.all([readConnection().catch(() => null), readAllIncidents(page)]);
  return (
    <main id="demo-content" className="px-3 py-4 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 px-1 font-display text-2xl font-semibold tracking-tight sm:mb-5 sm:px-0 sm:text-3xl">All Incidents</h1>
        {result.state === "ready" ? <IncidentList {...result} instance={connection?.host ?? "ServiceNow"} />
          : result.state === "unavailable" ? <div role="alert" className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-alert">{result.message}</p>
            <RetryButton className="mt-3" />
          </div>
          : <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FileText aria-hidden className="mx-auto mb-4 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Open a ServiceNow connection to see its incidents.</p>
            <Link href="/demo/connections?provider=servicenow" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Go to ServiceNow connections</Link>
          </div>}
      </div>
    </main>
  );
}

function DemoSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-lg border border-border bg-card/40" />
      <div className="h-64 rounded-lg border border-border bg-card/40" />
    </div>
  );
}
