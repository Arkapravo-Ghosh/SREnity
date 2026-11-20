import type { Metadata } from "next";
import { Suspense } from "react";
import { readUser } from "@/lib/connector";
import { notFound, redirect } from "next/navigation";
import { readConnection } from "@/lib/servicenow/session";
import { IncidentDetail } from "@/components/demo/IncidentDetail";

export const metadata: Metadata = {
  title: "Incident",
  robots: { index: false, follow: false },
};

const SYS_ID_PATTERN = /^[0-9a-f]{32}$/i;

export default function IncidentPage(props: PageProps<"/demo/incidents/[sysId]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <IncidentBody params={props.params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-8">
        <div className="grid animate-pulse gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="h-96 rounded-lg border border-border bg-card/40" />
          <div className="h-96 rounded-lg border border-border bg-card/40" />
        </div>
      </div>
    </div>
  );
}

async function IncidentBody({ params }: Pick<PageProps<"/demo/incidents/[sysId]">, "params">) {
  const user = await readUser();
  if (!user) redirect("/demo/login");
  const { sysId } = await params;

  // Validate before anything else: a malformed id is a 404, not a ServiceNow round trip.
  if (!SYS_ID_PATTERN.test(sysId)) notFound();

  const connection = await readConnection();
  if (!connection) redirect("/demo");

  return (
    <main id="demo-content" className="min-h-[calc(100svh-3.25rem)] px-3 py-3 sm:px-5 sm:py-8 lg:px-8">
      <IncidentDetail sysId={sysId} />
    </main>
  );
}
