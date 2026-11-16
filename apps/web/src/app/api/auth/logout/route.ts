import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/connector";
import { signOut } from "@/lib/demoSession";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    await signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 502 });
  }
}
