import { connectorRequest, type ConnectorConnection } from "../connector";
import { ServiceNowError } from "./errors";
import { requireConnection } from "./session";

export type ServiceNowPluginSupport = { service: boolean };

export type IncidentSummary = {
  sysId: string;
  number: string;
  shortDescription: string;
  /** Already formatted for display in the instance's own locale. */
  openedAt: string;
  priority: string;
  state: string;
  /** ServiceNow's internal state code, used to decide live vs. closed. */
  stateCode: string;
  category: string;
  assignmentGroup: string;
};

export type IncidentDetail = IncidentSummary & {
  description: string;
  businessService: string;
  cmdbCi: string;
  impact: string;
  urgency: string;
  /** Count of distinct people who have written a work note. */
  responderCount: number;
  workNoteCount: number;
};

/**
 * An explicit connection id (the sidebar lists every instance) is checked against the connector,
 * which enforces ownership from the login session. Without one, the selected connection is used.
 */
async function connectionId(id?: string): Promise<string> {
  if (!id) return (await requireConnection()).id;
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new ServiceNowError("not_found", "That ServiceNow connection was not found.", { status: 404 });
  const saved = await connectorRequest<ConnectorConnection>(`/connections/${id}`);
  if (saved.provider_id !== "servicenow") throw new ServiceNowError("not_found", "That ServiceNow connection was not found.", { status: 404 });
  if (saved.status !== "connected") throw new ServiceNowError("auth_failed", "Reconnect this ServiceNow instance.", { status: 409 });
  return saved.id;
}

export async function listIncidents({ includeClosed = false, offset = 0, connection }: {
  includeClosed?: boolean; offset?: number; connection?: string;
} = {}): Promise<{
  incidents: IncidentSummary[];
  next_offset?: number | null;
}> {
  const id = await connectionId(connection);
  return connectorRequest(`/connections/${id}/servicenow/incidents?include_closed=${includeClosed}&offset=${offset}`);
}
export async function getIncident(sysId: string): Promise<IncidentDetail> {
  const connection = await requireConnection();
  const result = await connectorRequest<{ incident: IncidentDetail }>(`/connections/${connection.id}/servicenow/incidents/${encodeURIComponent(sysId)}`);
  return result.incident;
}
