import type { IncidentDetail } from "./servicenow/incidents";

/**
 * The UI's only view of the backend. Components never call ServiceNow routes directly, so
 * swapping what answers — a different ITSM, a real backend — doesn't touch a single component.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError(body.error ?? "Something went wrong. Try again.", response.status);
  }

  return body as T;
}

export function checkSetup(instance: string) {
  return request<import("./servicenow/setup").SetupCheck>("/api/servicenow/setup", {
    method: "POST",
    body: JSON.stringify({ instance }),
  });
}

export type InstanceOAuthSettings = { client_id: string; client_secret: string; scope: string };
export function connectInstance(instance: string, oauth?: InstanceOAuthSettings) {
  return request<{ authorizeUrl: string }>("/api/servicenow/connect", {
    method: "POST",
    body: JSON.stringify({ instance, ...(oauth ? { oauth } : {}) }),
  });
}

export function disconnect() {
  return request<{ ok: boolean }>("/api/servicenow/disconnect", { method: "POST" });
}

export function fetchTimeline(sysId: string) {
  return request<import("./servicenow/timeline").IncidentTimeline>(
    `/api/servicenow/incidents/${encodeURIComponent(sysId)}/timeline`,
  );
}

export function fetchContext(sysId: string, refresh = false) {
  return request<import("./ai/types").IncidentContext>(
    `/api/servicenow/incidents/${encodeURIComponent(sysId)}/context${refresh ? "?refresh=1" : ""}`,
  );
}

export function fetchHistory(sysId: string, refresh = false) {
  return request<import("./ai/types").IncidentHistory>(
    `/api/servicenow/incidents/${encodeURIComponent(sysId)}/history${refresh ? "?refresh=1" : ""}`,
  );
}

export function fetchIncident(sysId: string) {
  return request<{ incident: IncidentDetail }>(
    `/api/servicenow/incidents/${encodeURIComponent(sysId)}`,
  );
}
