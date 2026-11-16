import { NextResponse } from "next/server";
import { readInstances } from "@/lib/incidentMenu";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";

export async function GET() {
  try { return NextResponse.json({ instances: await readInstances() }); }
  catch (error) { return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 502 }); }
}
