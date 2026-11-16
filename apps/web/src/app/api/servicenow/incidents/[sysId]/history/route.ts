import { NextResponse } from "next/server";
import { getHistory } from "@/lib/ai/context";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";

const SYS_ID_PATTERN = /^[0-9a-f]{32}$/i;

export async function GET(request: Request, ctx: RouteContext<"/api/servicenow/incidents/[sysId]/history">) {
  const { sysId } = await ctx.params;
  if (!SYS_ID_PATTERN.test(sysId)) return NextResponse.json({ error: "That incident reference isn't valid." }, { status: 400 });
  try {
    return NextResponse.json(await getHistory(sysId, new URL(request.url).searchParams.get("refresh") === "1"));
  } catch (error) {
    const status = isServiceNowError(error) ? error.code === "auth_failed" ? 401 : error.code === "not_found" ? 404 : 502 : 502;
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}
