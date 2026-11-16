import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/connector";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
import { signIn } from "@/lib/demoSession";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    await signIn(body.email, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: isServiceNowError(error) ? error.status ?? 502 : 400 });
  }
}
