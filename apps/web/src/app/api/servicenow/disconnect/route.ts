import { NextResponse } from "next/server";
import { connectorRequest, sameOrigin } from "@/lib/connector";
import { clearSession, readConnection } from "@/lib/servicenow/session";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const connection = await readConnection();
    if (connection) await connectorRequest(`/connections/${connection.id}/disconnect`, { method: "POST" });
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: 502 }); }
}
