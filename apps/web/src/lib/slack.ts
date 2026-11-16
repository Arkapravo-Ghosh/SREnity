import "server-only";

import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/connector";

export const SLACK_FLOW_COOKIE = "srenity_slack_flow";
export const SLACK_CALLBACK_PATH = "/api/slack/callback";

export type SlackConnections = {
  configured: boolean;
  connections: {
    id: string;
    status: "connected" | "disconnected" | "reauthorization_required";
    workspace_id: string;
    workspace_name: string;
    channel_id: string;
    channel_name: string;
  }[];
};

export function returnToConnections(request: Request, kind: "slackStatus" | "slackError", message: string) {
  const url = new URL("/demo/connections#slack-connections", requestOrigin(request));
  url.searchParams.set(kind, message);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
