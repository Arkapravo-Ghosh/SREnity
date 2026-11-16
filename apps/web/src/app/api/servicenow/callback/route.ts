import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectorRequest, requestOrigin, type ConnectorConnection } from "@/lib/connector";
import { SESSION_COOKIE } from "@/lib/servicenow/cookies";
import { toUserMessage } from "@/lib/servicenow/errors";
import { saveSession } from "@/lib/servicenow/session";

export async function GET(request: NextRequest) {
  const failure = (message: string) => NextResponse.redirect(new URL(`/demo/connections?error=${encodeURIComponent(message)}`, requestOrigin(request)));
  const store = await cookies();
  const expected = store.get(SESSION_COOKIE.flow)?.value;
  store.delete(SESSION_COOKIE.flow);
  const returned = request.nextUrl.searchParams.get("state");
  if (!expected || !returned || Buffer.byteLength(expected) !== Buffer.byteLength(returned) || !timingSafeEqual(Buffer.from(expected), Buffer.from(returned))) return failure("That connection attempt expired or did not match. Start again.");
  if (request.nextUrl.searchParams.has("error")) return failure("ServiceNow authorization was declined or could not be completed.");
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return failure("ServiceNow did not return an authorization code. Start again.");
  try {
    const connection = await connectorRequest<ConnectorConnection>("/providers/servicenow/oauth/complete", { method: "POST", body: JSON.stringify({ state: expected, code }) });
    await saveSession(connection);
  } catch (error) { return failure(toUserMessage(error)); }
  return NextResponse.redirect(new URL("/demo/connections?status=servicenow", requestOrigin(request)));
}
