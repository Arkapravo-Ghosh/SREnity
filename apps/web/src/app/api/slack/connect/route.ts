import { NextResponse } from "next/server";
import { connectorRequest, requestOrigin, sameOrigin } from "@/lib/connector";
import { returnToConnections, SLACK_CALLBACK_PATH, SLACK_FLOW_COOKIE } from "@/lib/slack";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const redirectUri = new URL(SLACK_CALLBACK_PATH, requestOrigin(request));
    const result = await connectorRequest<{ authorizeUrl: string; state: string }>("/providers/slack/oauth/start", {
      method: "POST",
      body: JSON.stringify({ redirect_uri: redirectUri.href }),
    });
    const authorization = new URL(result.authorizeUrl);
    if (authorization.origin !== "https://slack.com" || authorization.pathname !== "/oauth/v2/authorize") {
      return returnToConnections(request, "slackError", "The connector returned an invalid Slack authorization URL.");
    }
    const response = NextResponse.redirect(authorization, 303);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(SLACK_FLOW_COOKIE, result.state, {
      httpOnly: true, secure: true, sameSite: "lax", path: SLACK_CALLBACK_PATH, maxAge: 600,
    });
    return response;
  } catch (error) {
    return returnToConnections(request, "slackError", toUserMessage(error));
  }
}
