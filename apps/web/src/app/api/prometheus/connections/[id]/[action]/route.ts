import { NextResponse } from "next/server";
import { connectorRequest, sameOrigin } from "@/lib/connector";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
type Context = RouteContext<"/api/prometheus/connections/[id]/[action]">;
function failure(error: unknown) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 }); }
export async function GET(_request: Request, context: Context) {
  const { id, action } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(id) || action !== "snapshot") return NextResponse.json({ error: "Not found." }, { status: 404 });
  try { return NextResponse.json(await connectorRequest(`/connections/${id}/prometheus/snapshot`)); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id, action } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(id) || !["query", "disconnect"].includes(action)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    // Check provider and ownership before generic disconnect can affect another integration.
    const connection = await connectorRequest<{ provider_id: string }>(`/connections/${id}`);
    if (connection.provider_id !== "prometheus") return NextResponse.json({ error: "Not a Prometheus connection." }, { status: 400 });
    const path = action === "query" ? `/connections/${id}/prometheus/query` : `/connections/${id}/disconnect`;
    return NextResponse.json(await connectorRequest(path, { method: "POST", ...(action === "query" ? { body: JSON.stringify(await request.json()) } : {}) }));
  } catch (error) { return failure(error); }
}
