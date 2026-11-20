import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, connectorRequest, requestOrigin, sameOrigin, serviceNowCallbackUrl } from "@/lib/connector";
import { setupVariant, type SetupCheck } from "@/lib/servicenow/setup";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";

/** Downloads the SREnity OAuth-client update set that matches this site (production or local). */
export async function GET(request: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const base = process.env.SRENITY_CONNECTOR_URL;
  if (!token || !base) return NextResponse.json({ error: "Sign in to download the OAuth setup file." }, { status: 401 });
  const variant = setupVariant(requestOrigin(request));
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/v1/providers/servicenow/oauth-setup/${variant}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return NextResponse.json({ error: "Could not download the OAuth setup file." }, { status: response.status });
    let xml = await response.text();
    const callbackUrl = serviceNowCallbackUrl();
    if (variant === "prod") {
      xml = xml.replace(/<redirect_url>[\s\S]*?<\/redirect_url>/g, `<redirect_url>${callbackUrl}</redirect_url>`);
    } else {
      xml = xml.replace(/<redirect_url>(https?:\/\/[^,<]+)([\s\S]*?)<\/redirect_url>/g, (_match, _oldProd, rest) => {
        return `<redirect_url>${callbackUrl}${rest}</redirect_url>`;
      });
    }
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": response.headers.get("content-disposition") || `attachment; filename="srenity-oauth-client-${variant}.xml"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "The connector service is unavailable. Try again shortly." }, { status: 502 });
  }
}

/** Checks, before any sign-in, that SREnity's OAuth client is committed on the instance. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { instance?: unknown };
    if (typeof body.instance !== "string" || !body.instance.trim()) return NextResponse.json({ error: "Enter your ServiceNow instance address." }, { status: 400 });
    const result = await connectorRequest<SetupCheck>("/providers/servicenow/oauth-setup/check", {
      method: "POST", body: JSON.stringify({ instance: body.instance, redirect_uri: serviceNowCallbackUrl() }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 });
  }
}
