import { NextResponse } from "next/server";
import { connectorRequest, sameOrigin, type ConnectorConnection } from "@/lib/connector";
import { saveSession } from "@/lib/servicenow/session";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== "string" || !/^[a-f0-9-]{36}$/i.test(body.id)) return NextResponse.json({ error: "Choose a saved connection." }, { status: 400 });
    // Ownership comes from the login session, never the browser's selected ID.
    const connection = await connectorRequest<ConnectorConnection>(`/connections/${body.id}`);
    if (connection.status !== "connected" || connection.provider_id !== "servicenow") return NextResponse.json({ error: "Authorize this ServiceNow connection again." }, { status: 409 });
    await saveSession(connection);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 }); }
}
