import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { readUser } from "@/lib/connector";
import { readPrometheusConnections } from "@/lib/prometheus";
import { AllMetrics } from "@/components/demo/AllMetrics";
import { PrometheusPanel } from "@/components/demo/PrometheusPanel";

export const metadata: Metadata = { title: "Prometheus connections", robots: { index: false, follow: false } };
async function Body({ searchParams }: Pick<PageProps<"/demo/prometheus">, "searchParams">) {
  const user = await readUser();
  if (!user) redirect("/demo/login");
  const [saved, params] = await Promise.all([
    readPrometheusConnections().catch(() => null), searchParams,
  ]);
  const requested = typeof params.connection === "string" ? params.connection : null;
  const current = saved?.find(c => c.id === requested);
  return <main id="demo-content" className="px-3 py-4 sm:p-8 lg:p-10">
    {!saved ? <p role="alert" className="text-sm text-alert">Could not load Prometheus connections. Refresh to try again.</p>
      : current ? <PrometheusPanel key={current.id} connection={current} />
      : <AllMetrics servers={saved} />}
  </main>;
}
export default function Page(props: PageProps<"/demo/prometheus">) {
  return <Suspense fallback={<div className="p-6 text-sm">Loading your Prometheus connections…</div>}><Body searchParams={props.searchParams} /></Suspense>;
}
