import { NextResponse, type NextRequest } from "next/server";
import { sameOrigin, requestOrigin, serviceNowCallbackUrl } from "@/lib/connector";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
import { startServiceNow } from "@/lib/servicenow/connect";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { instance?: unknown; oauth?: unknown };
    if (typeof body.instance !== "string" || !body.instance.trim()) return NextResponse.json({ error: "Enter your ServiceNow instance address." }, { status: 400 });
    let oauthSettings: { client_id: string; client_secret: string; scope: string } | undefined;
    if (body.oauth !== undefined) {
      const oauth = body.oauth as Record<string, unknown> | null;
      if (!oauth || typeof oauth !== "object" || Array.isArray(oauth) ||
          typeof oauth.client_id !== "string" || !oauth.client_id.trim() || oauth.client_id.length > 200 ||
          typeof oauth.client_secret !== "string" || oauth.client_secret.length > 4096 ||
          typeof oauth.scope !== "string" || oauth.scope.length > 500) {
        return NextResponse.json({ error: "Enter the Client ID and optional secret and scope from this instance's OAuth application." }, { status: 400 });
      }
      oauthSettings = { client_id: oauth.client_id.trim(), client_secret: oauth.client_secret, scope: oauth.scope.trim() };
    }
    const authorizeUrl = await startServiceNow(body.instance, serviceNowCallbackUrl(), oauthSettings);
    return NextResponse.json({ authorizeUrl });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 });
  }
}
