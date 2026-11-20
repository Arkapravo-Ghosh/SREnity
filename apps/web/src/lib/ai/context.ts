import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "../connector";
import { ServiceNowError, type ServiceNowErrorCode } from "../servicenow/errors";
import { requireConnection } from "../servicenow/session";
import type { IncidentContext, IncidentHistory } from "./types";

/** srenity-ai reads evidence through the connector as the signed-in user; it never sees more than they can. */
export function getContext(sysId: string, refresh = false): Promise<IncidentContext> {
  return aiRequest<IncidentContext>(sysId, "context", refresh);
}

export function getHistory(sysId: string, refresh = false): Promise<IncidentHistory> {
  return aiRequest<IncidentHistory>(sysId, "history", refresh);
}

async function aiRequest<T>(sysId: string, kind: "context" | "history", refresh: boolean): Promise<T> {
  const baseUrl = process.env.SRENITY_AI_URL;
  if (!baseUrl) throw new ServiceNowError("unknown", "The SREnity AI service is not configured on this deployment.");
  const connection = await requireConnection();
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw new ServiceNowError("auth_failed", "Sign in again.", { status: 401 });
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/v1/connections/${connection.id}/incidents/${encodeURIComponent(sysId)}/${kind}${refresh ? "?refresh=true" : ""}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(240_000) },
    );
  } catch {
    throw new ServiceNowError("unreachable", "The SREnity AI service is unavailable. Try again shortly.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code: ServiceNowErrorCode = response.status === 401 ? "auth_failed" : response.status === 404 ? "not_found" : "unknown";
    throw new ServiceNowError(code, typeof body?.error === "string" ? body.error : "SREnity could not build the incident context.", { status: response.status });
  }
  if (!body) throw new ServiceNowError("bad_response", "The SREnity AI service returned an unreadable response.");
  return body as T;
}
