import { connectorRequest } from "../connector";
import { requireConnection } from "./session";

export type TimelineEventKind =
  | "ticket"
  | "work_note"
  | "comment"
  | "state"
  | "handover"
  | "field_change"
  | "alert_pending"
  | "alert_firing"
  | "alert_resolved";

export type TimelineEvent = {
  id: string;
  /** ISO-8601 UTC. */
  at: string;
  kind: TimelineEventKind;
  title: string;
  detail: string;
  actor: string;
  system: "servicenow" | "prometheus";
  sourceLabel: string;
  /** The evidence source and record this line was derived from. */
  evidence: { source: string; record: string };
};

export type EvidenceRecord = {
  id: string;
  at: string | null;
  summary: string;
  raw: Record<string, unknown>;
};

export type EvidenceSource = {
  id: string;
  system: "servicenow" | "prometheus" | "slack";
  kind: "incident" | "journal" | "audit" | "alerts" | "sla" | "neighbours" | "chat";
  label: string;
  /** Where the data was read from, e.g. "ServiceNow · Table API · sys_journal_field". */
  location: string;
  /** The exact request or PromQL used. */
  query: string;
  status: "ok" | "unavailable" | "missing";
  message: string;
  fetchedAt: string;
  records: EvidenceRecord[];
  linkedAlerts?: number;
};

export type IncidentTimeline = {
  incident: { number: string; sysId: string; openedAt: string; ci: string; correlationId: string };
  window: { start: string; end: string; stepSeconds: number };
  events: TimelineEvent[];
  evidence: EvidenceSource[];
  generatedAt: string;
  method: "deterministic";
  note: string;
};

export async function getTimeline(sysId: string): Promise<IncidentTimeline> {
  const connection = await requireConnection();
  return connectorRequest<IncidentTimeline>(
    `/connections/${connection.id}/servicenow/incidents/${encodeURIComponent(sysId)}/timeline`,
  );
}
