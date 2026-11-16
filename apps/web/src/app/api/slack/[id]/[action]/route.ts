import { NextResponse } from "next/server";
import { connectorRequest, sameOrigin } from "@/lib/connector";
import { returnToConnections } from "@/lib/slack";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function POST(request: Request, context: RouteContext<"/api/slack/[id]/[action]">) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const { id, action } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(id) || (action !== "test" && action !== "disconnect")) {
    return NextResponse.json({ error: "Invalid Slack connection action." }, { status: 400 });
  }

  try {
    if (action === "test") {
      await connectorRequest("/connections/" + id + "/slack/test", { method: "POST" });
      return returnToConnections(request, "slackStatus", "Test message sent.");
    }
    await connectorRequest("/connections/" + id + "/slack/disconnect", { method: "POST" });
    return returnToConnections(request, "slackStatus", "Slack channel disconnected from SREnity.");
  } catch (error) {
    return returnToConnections(request, "slackError", toUserMessage(error));
  }
}
