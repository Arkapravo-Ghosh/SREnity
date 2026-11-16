import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { connectorRequest } from "@/lib/connector";
import { SESSION_COOKIE } from "./cookies";

type OAuth = { client_id: string; client_secret: string; scope: string };

export async function startServiceNow(instance: string, redirectUri: string, oauth?: OAuth, connectionName?: string) {
  let registrationId: string | undefined;
  if (oauth) {
    const registration = await connectorRequest<{ id: string }>("/providers/servicenow/registrations", {
      method: "PUT", body: JSON.stringify({ instance, name: "SREnity demo", ...oauth }),
    });
    registrationId = registration.id;
  }
  const result = await connectorRequest<{ authorizeUrl: string; state: string }>("/providers/servicenow/oauth/start", {
    method: "POST",
    body: JSON.stringify({
      instance, name: connectionName ?? "SREnity demo " + randomUUID(), redirect_uri: redirectUri,
      ...(registrationId ? { registration_id: registrationId } : {}),
    }),
  });
  (await cookies()).set(SESSION_COOKIE.flow, result.state, {
    httpOnly: true, sameSite: "lax", secure: new URL(redirectUri).protocol === "https:", path: "/", maxAge: 600,
  });
  return result.authorizeUrl;
}
