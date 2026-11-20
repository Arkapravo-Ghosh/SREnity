import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, connectorRequest } from "@/lib/connector";
import { SESSION_COOKIE } from "@/lib/servicenow/cookies";
import { SLACK_CALLBACK_PATH, SLACK_FLOW_COOKIE } from "@/lib/slack";
import { isServiceNowError } from "@/lib/servicenow/errors";

async function clearFlows() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.connection);
  store.delete(SESSION_COOKIE.flow);
  store.set(SLACK_FLOW_COOKIE, "", { path: SLACK_CALLBACK_PATH, secure: true, maxAge: 0 });
}

export async function signIn(email: string, password: string) {
  const result = await connectorRequest<{ session_token: string; expires_in: number }>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  }, null);
  const store = await cookies();
  if (store.get(AUTH_COOKIE)?.value) await connectorRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
  await clearFlows();
  store.set(AUTH_COOKIE, result.session_token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: result.expires_in,
  });
}

export async function signOut() {
  const store = await cookies();
  if (store.get(AUTH_COOKIE)?.value) {
    try { await connectorRequest("/auth/logout", { method: "POST" }); }
    catch (error) { if (!isServiceNowError(error) || error.status !== 401) throw error; }
  }
  store.delete(AUTH_COOKIE);
  await clearFlows();
}
