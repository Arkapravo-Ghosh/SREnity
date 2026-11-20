import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, connectorRequest, sameOrigin } from "@/lib/connector";
import { requireConnection } from "@/lib/servicenow/session";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
type Context = RouteContext<"/api/servicenow/app/[action]">;
function failure(error: unknown) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 }); }
export async function GET(request: Request, context: Context) {
  const { action } = await context.params;
  if (!["status", "package"].includes(action)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    if (action === "status") {
      const id = new URL(request.url).searchParams.get("connection") ?? (await requireConnection()).id;
      if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid connection reference." }, { status: 400 });
      return NextResponse.json(await connectorRequest(`/connections/${id}/servicenow/app`));
    }
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    const base = process.env.SRENITY_CONNECTOR_URL;
    if (!token || !base) return NextResponse.json({ error: "Sign in to download the application package." }, { status: 401 });
    const response = await fetch(`${base.replace(/\/$/, "")}/v1/providers/servicenow/app/package`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return NextResponse.json({ error: "Could not download the application package. Check your account permissions." }, { status: response.status });
    return new Response(response.body, { headers: { "Content-Type": "application/zip", "Content-Disposition": response.headers.get("content-disposition") || 'attachment; filename="servicenow-bridge.zip"', "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { action } = await context.params;
  if (action !== "install") return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const connection = await requireConnection();
    const result = await connectorRequest(`/connections/${connection.id}/servicenow/app/install`, { method: "POST", body: JSON.stringify(await request.json()) });
    return NextResponse.json(result);
  } catch (error) { return failure(error); }
}
