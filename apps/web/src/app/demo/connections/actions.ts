"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { browserOrigin, connectorRequest, serviceNowCallbackUrl, type ConnectorConnection } from "@/lib/connector";
import { startServiceNow } from "@/lib/servicenow/connect";
import { toUserMessage } from "@/lib/servicenow/errors";
import { clearSession, readSelectedReference, saveSession } from "@/lib/servicenow/session";
import type { SetupCheck } from "@/lib/servicenow/setup";
import { SLACK_CALLBACK_PATH, SLACK_FLOW_COOKIE } from "@/lib/slack";

async function origin() {
  const requestHeaders = await headers();
  return browserOrigin(requestHeaders, new URL(requestHeaders.get("origin") ?? "http://localhost:3000"));
}

function value(form: FormData, name: string) {
  const input = form.get(name);
  return typeof input === "string" ? input : "";
}

async function getConnection(id: string, provider: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error("Invalid connection ID");
  const connection = await connectorRequest<ConnectorConnection>("/connections/" + id);
  if (connection.provider_id !== provider) throw new Error("Unexpected connection provider");
  return connection;
}

export async function connectServiceNow(id: string | null, _previous: string, form: FormData) {
  const clientId = value(form, "client_id").trim();
  const clientSecret = value(form, "client_secret");
  const scope = value(form, "scope").trim();
  const custom = form.has("custom");
  if (custom && (!clientId || clientId.length > 200 || clientSecret.length > 4096 || scope.length > 500)) {
    return "Enter a valid OAuth Client ID, optional secret and scope.";
  }

  let authorizeUrl: string;
  try {
    const saved = id ? await getConnection(id, "servicenow") : null;
    const instance = saved?.instance_url ?? value(form, "instance").trim();
    if (!instance || instance.length > 2048) return "Enter your ServiceNow instance address.";
    const redirectUri = serviceNowCallbackUrl();
    if (!custom && !saved) {
      const setup = await connectorRequest<SetupCheck>("/providers/servicenow/oauth-setup/check", {
        method: "POST", body: JSON.stringify({ instance, redirect_uri: redirectUri }),
      });
      if (!setup.ready) return setup.message;
    }
    authorizeUrl = await startServiceNow(instance, redirectUri,
      custom ? { client_id: clientId, client_secret: clientSecret, scope } : undefined, saved?.name);
  } catch (error) { return toUserMessage(error); }
  redirect(authorizeUrl);
}

export async function connectPrometheus(id: string | null, _previous: string, form: FormData) {
  const auth = value(form, "auth_type");
  if (auth !== "none" && auth !== "bearer" && auth !== "basic") return "Choose an authentication method.";
  try {
    const saved = id ? await getConnection(id, "prometheus") : null;
    const name = saved?.name ?? value(form, "name").trim();
    const url = saved?.instance_url ?? value(form, "url").trim();
    await connectorRequest("/providers/prometheus/connections", {
      method: "POST",
      body: JSON.stringify({
        name, url, auth_type: auth,
        ...(auth === "bearer" ? { bearer_token: value(form, "bearer_token") } : {}),
        ...(auth === "basic" ? { username: value(form, "username"), password: value(form, "password") } : {}),
      }),
    });
  } catch (error) { return toUserMessage(error); }
  revalidatePath("/demo/connections");
  redirect("/demo/connections?status=prometheus");
}

export async function connectSlack() {
  let authorizeUrl: URL;
  try {
    const result = await connectorRequest<{ authorizeUrl: string; state: string }>("/providers/slack/oauth/start", {
      method: "POST", body: JSON.stringify({ redirect_uri: (await origin()) + SLACK_CALLBACK_PATH }),
    });
    authorizeUrl = new URL(result.authorizeUrl);
    if (authorizeUrl.origin !== "https://slack.com" || authorizeUrl.pathname !== "/oauth/v2/authorize") {
      return "The connector returned an invalid Slack authorization URL.";
    }
    (await cookies()).set(SLACK_FLOW_COOKIE, result.state, {
      httpOnly: true, secure: true, sameSite: "lax", path: SLACK_CALLBACK_PATH, maxAge: 600,
    });
  } catch (error) { return toUserMessage(error); }
  redirect(authorizeUrl.href);
}

export async function openServiceNow(id: string) {
  try {
    const connection = await getConnection(id, "servicenow");
    if (connection.status !== "connected") return "Reconnect this ServiceNow instance first.";
    await saveSession(connection);
  } catch (error) { return toUserMessage(error); }
  redirect("/demo");
}

export async function disconnectConnection(id: string, provider: string) {
  try {
    await getConnection(id, provider);
    await connectorRequest("/connections/" + id + "/disconnect", { method: "POST" });
    if (provider === "servicenow" && (await readSelectedReference())?.id === id) await clearSession();
  } catch (error) { return toUserMessage(error); }
  revalidatePath("/demo/connections");
  redirect("/demo/connections?status=disconnected");
}

export async function testSlack(id: string) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return "Choose a Slack connection.";
  try { await connectorRequest("/connections/" + id + "/slack/test", { method: "POST" }); }
  catch (error) { return toUserMessage(error); }
  redirect("/demo/connections?status=test");
}

export async function installServiceNowApp(id: string, requestId: string) {
  const uuid = /^[a-f0-9-]{36}$/i;
  if (!uuid.test(id) || !uuid.test(requestId)) return { error: "Invalid installation request." };
  return connectorRequest<import("@/components/demo/ServiceNowApp").ServiceNowAppResult>(
    "/connections/" + encodeURIComponent(id) + "/servicenow/app/install",
    { method: "POST", body: JSON.stringify({ request_id: requestId }) },
  ).then(result => ({ result }), error => ({ error: toUserMessage(error) }));
}
