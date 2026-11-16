import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { ServiceNowError, type ServiceNowErrorCode } from "./servicenow/errors";

/** Browser carries an opaque HttpOnly session; connector derives its admin ownership. */
export const AUTH_COOKIE = "srenity_demo_session";
export async function connectorRequest<T>(path: string, init: RequestInit = {}, authToken?: string | null): Promise<T> {
  const baseUrl = process.env.SRENITY_CONNECTOR_URL;
  const token = authToken === undefined ? (await cookies()).get(AUTH_COOKIE)?.value : authToken;
  if (!baseUrl) throw new ServiceNowError("unknown", "The connector service is not configured on this deployment.");
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store", signal: AbortSignal.timeout(35_000),
    });
  } catch { throw new ServiceNowError("unreachable", "The connector service is unavailable. Try again shortly."); }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const codes: ServiceNowErrorCode[] = ["invalid_instance", "auth_failed", "forbidden", "not_found", "rate_limited", "unreachable", "bad_response", "unknown"];
    const code = body?.code === "unauthorized" ? "auth_failed" : codes.includes(body?.code) ? body.code as ServiceNowErrorCode : "unknown";
    throw new ServiceNowError(code, typeof body?.error === "string" ? body.error : "The connector could not complete this request.", { status: response.status });
  }
  if (!body) throw new ServiceNowError("bad_response", "The connector returned an unreadable response.");
  return body as T;
}
export type ConnectorConnection = { id: string; provider_id: string; name: string; instance_url: string; status: "connected" | "disconnected" | "reauthorization_required" };
// Next's internal request URL can canonicalize 127.0.0.1 to localhost. Preserve
// the browser-facing host for CSRF checks and the registered OAuth callback.
export function browserOrigin(requestHeaders: Pick<Headers, "get">, fallback: URL): string {
  const protocol = requestHeaders.get("x-forwarded-proto") ?? fallback.protocol.slice(0, -1);
  return `${protocol}://${requestHeaders.get("host") ?? fallback.host}`;
}
export function requestOrigin(request: Request): string {
  return browserOrigin(request.headers, new URL(request.url));
}
export function sameOrigin(request: Request): boolean { return request.headers.get("origin") === requestOrigin(request); }

export function connectorBaseUrl(): string {
  const env = process.env.SRENITY_CONNECTOR_URL || "https://connector.srenity.tech";
  const url = env.startsWith("http://") || env.startsWith("https://") ? env : `https://${env}`;
  return url.replace(/\/$/, "");
}

export function serviceNowCallbackUrl(): string {
  return `${connectorBaseUrl()}/api/servicenow/callback`;
}

export const readUser = cache(async (): Promise<{ email: string } | null> => {
  if (!(await cookies()).get(AUTH_COOKIE)?.value) return null;
  try { return await connectorRequest<{ email: string }>("/auth/me"); }
  catch (error) {
    if (error instanceof ServiceNowError && error.status === 401) return null;
    throw error;
  }
});
