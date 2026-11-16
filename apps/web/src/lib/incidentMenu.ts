import "server-only";
import { cache } from "react";
import { connectorRequest, type ConnectorConnection } from "@/lib/connector";
import { isServiceNowError } from "@/lib/servicenow/errors";
import { listIncidents } from "@/lib/servicenow/incidents";
import { readConnection, readSelectedReference } from "@/lib/servicenow/session";

export function incidentPage(input: unknown) {
  return typeof input === "string" && /^\d{1,7}$/.test(input) ? Math.max(1, Number(input)) : 1;
}

function logFailure(scope: string, error: unknown) {
  // Code and status only: never the upstream body, tokens or connection ids.
  console.warn(`[incidents] ${scope} failed:`, isServiceNowError(error) ? `${error.code} (${error.status ?? "-"})` : "unexpected error");
}

/** The connector names the instance and the cause ("dev480919 is returning server errors…"); show that, not a generic line. */
function failureMessage(error: unknown) {
  return isServiceNowError(error) ? error.userMessage : "Could not load incidents. Try again.";
}

export const readAllIncidents = cache(async (page: number) => {
  try {
    const connection = await readConnection();
    if (!connection) return { state: "disconnected" as const };
    const result = await listIncidents({ includeClosed: true, offset: (page - 1) * 100 });
    return { state: "ready" as const, page, hasNext: result.next_offset != null, incidents: result.incidents };
  } catch (error) {
    logFailure("selected instance", error);
    return { state: "unavailable" as const, message: failureMessage(error) };
  }
});

export async function readIncidentMenu(page: number, connection?: string) {
  if (connection) {
    try {
      const result = await listIncidents({ includeClosed: true, offset: (page - 1) * 100, connection });
      return {
        state: "ready" as const, page, hasNext: result.next_offset != null,
        incidents: result.incidents.map(({ sysId, number, shortDescription }) => ({ sysId, number, shortDescription })),
      };
    } catch (error) {
      logFailure("instance menu", error);
      return { state: "unavailable" as const, reauthorize: isServiceNowError(error) && error.code === "auth_failed",
               message: failureMessage(error) };
    }
  }
  const result = await readAllIncidents(page);
  if (result.state !== "ready") return result;
  return {
    state: "ready" as const, page, hasNext: result.hasNext,
    incidents: result.incidents.map(({ sysId, number, shortDescription }) => ({ sysId, number, shortDescription })),
  };
}

export type InstanceMenuItem = { id: string; host: string; status: ConnectorConnection["status"]; selected: boolean };

/** Every saved ServiceNow instance for the sidebar, the selected one first. */
export async function readInstances(): Promise<InstanceMenuItem[]> {
  const [saved, selected] = await Promise.all([
    connectorRequest<{ connections: ConnectorConnection[] }>("/connections"), readSelectedReference(),
  ]);
  return saved.connections
    .filter(row => row.provider_id === "servicenow" && row.status !== "disconnected")
    .map(row => ({ id: row.id, host: row.instance_url.replace(/^https?:\/\//, "").replace(/\/$/, ""), status: row.status, selected: row.id === selected?.id }))
    .sort((a, b) => Number(b.selected) - Number(a.selected) || a.host.localeCompare(b.host));
}
