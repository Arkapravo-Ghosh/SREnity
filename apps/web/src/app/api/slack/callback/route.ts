import { timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";
import { connectorRequest } from "@/lib/connector";
import { returnToConnections, SLACK_CALLBACK_PATH, SLACK_FLOW_COOKIE } from "@/lib/slack";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function GET(request: NextRequest) {
  function finish(kind: "slackStatus" | "slackError", message: string) {
    const response = returnToConnections(request, kind, message);
    response.cookies.set(SLACK_FLOW_COOKIE, "", {
      httpOnly: true, secure: true, sameSite: "lax", path: SLACK_CALLBACK_PATH, maxAge: 0,
    });
    return response;
  }

  const expected = Buffer.from(request.cookies.get(SLACK_FLOW_COOKIE)?.value ?? "");
  const returned = Buffer.from(request.nextUrl.searchParams.get("state") ?? "");
  if (!expected.length || expected.length !== returned.length || !timingSafeEqual(expected, returned)) {
    return returnToConnections(request, "slackError", "That Slack authorization attempt expired or did not match. Start again.");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.searchParams.has("error") || !code) {
    return finish("slackError", "Slack authorization was declined or incomplete.");
  }

  try {
    await connectorRequest("/providers/slack/oauth/complete", {
      method: "POST",
      body: JSON.stringify({ state: expected.toString(), code }),
    });
    return finish("slackStatus", "Slack channel connected.");
  } catch (error) {
    return finish("slackError", toUserMessage(error));
  }
}
