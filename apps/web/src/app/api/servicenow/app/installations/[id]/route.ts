import { NextResponse } from "next/server";
import { connectorRequest } from "@/lib/connector";
import { requireConnection } from "@/lib/servicenow/session";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
export async function GET(request: Request, context: RouteContext<"/api/servicenow/app/installations/[id]">) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid installation reference." }, { status: 400 });
  try {
    const connection = new URL(request.url).searchParams.get("connection") ?? (await requireConnection()).id;
    if (!/^[a-f0-9-]{36}$/i.test(connection)) return NextResponse.json({ error: "Invalid connection reference." }, { status: 400 });
    return NextResponse.json(await connectorRequest(`/connections/${connection}/servicenow/app/installations/${id}`));
  } catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 502 }); }
}
