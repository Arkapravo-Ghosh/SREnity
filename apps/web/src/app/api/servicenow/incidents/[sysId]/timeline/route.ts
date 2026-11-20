import { NextResponse } from "next/server";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
import { getTimeline } from "@/lib/servicenow/timeline";
import { clearSession } from "@/lib/servicenow/session";

const SYS_ID_PATTERN = /^[0-9a-f]{32}$/i;

export async function GET(_request: Request, ctx: RouteContext<"/api/servicenow/incidents/[sysId]/timeline">) {
  const { sysId } = await ctx.params;
  if (!SYS_ID_PATTERN.test(sysId)) {
    return NextResponse.json({ error: "That incident reference isn't valid." }, { status: 400 });
  }
  try {
    return NextResponse.json(await getTimeline(sysId));
  } catch (error) {
    if (isServiceNowError(error) && error.code === "auth_failed") await clearSession();
    const status = isServiceNowError(error)
      ? error.code === "auth_failed"
        ? 401
        : error.code === "not_found"
          ? 404
          : 502
      : 502;
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}
