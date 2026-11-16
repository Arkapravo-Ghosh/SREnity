import { NextResponse } from "next/server";
import { isServiceNowError, toUserMessage } from "@/lib/servicenow/errors";
import { readIncidentMenu, incidentPage } from "@/lib/incidentMenu";
import { getIncident, listIncidents } from "@/lib/servicenow/incidents";
import { clearSession, readConnection } from "@/lib/servicenow/session";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.get("all") === "1") {
    const connection = params.get("connection") ?? undefined;
    const current = connection ? (await readConnection().catch(() => null))?.id === connection : true;
    const menu = await readIncidentMenu(incidentPage(params.get("page")), connection);
    const selected = params.get("selected");
    // The open incident belongs to the selected instance; only pin it into that instance's list.
    if (menu.state === "ready" && current && selected && /^[a-f0-9]{32}$/i.test(selected)
        && !menu.incidents.some(incident => incident.sysId === selected)) {
      const incident = await getIncident(selected).catch(() => null);
      if (incident) {
        const { sysId, number, shortDescription } = incident;
        menu.incidents.unshift({ sysId, number, shortDescription });
      }
    }
    return NextResponse.json(menu);
  }
  try {
    const [{ incidents }, connection] = await Promise.all([listIncidents(), readConnection()]);
    return NextResponse.json({ incidents, instance: connection?.host ?? null });
  } catch (error) {
    // An expired or revoked refresh token means the stored connection is dead. Clearing it here
    // sends the user straight back to the connect screen instead of looping on failures.
    if (isServiceNowError(error) && error.code === "auth_failed") {
      await clearSession();
    }
    const status = isServiceNowError(error) && error.code === "auth_failed" ? 401 : 502;
    return NextResponse.json({ error: toUserMessage(error) }, { status });
  }
}
