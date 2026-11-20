import { NextResponse } from "next/server";
import { connectorRequest, sameOrigin } from "@/lib/connector";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";

export async function GET() {
  try { return NextResponse.json(await connectorRequest("/providers/prometheus/connections")); }
  catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 502 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body: unknown = await request.json();
    return NextResponse.json(await connectorRequest("/providers/prometheus/connections", { method: "POST", body: JSON.stringify(body) }), { status: 201 });
  } catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 }); }
}
