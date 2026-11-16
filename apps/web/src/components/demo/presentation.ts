/** Shared display rules for incident data, so the list and the detail view agree. */

/**
 * ServiceNow's stock incident state codes. Custom instances renumber these, so an unknown code
 * falls back to treating the incident as live rather than silently labelling it closed.
 */
const CLOSED_STATE_CODES = new Set(["3", "4", "7", "8"]);

export function isClosed(stateCode: string): boolean {
  return CLOSED_STATE_CODES.has(stateCode);
}

export function formatOpened(openedAt: string): string {
  if (!openedAt) return "";
  // ServiceNow returns display values as "2026-11-07 07:43:48" in the instance's timezone.
  const parsed = new Date(openedAt.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return openedAt;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Strips the "3 - " prefix ServiceNow puts on choice labels, keeping just the label. */
export function choiceLabel(value: string): string {
  return value.replace(/^\d+\s*[-–]\s*/, "").trim() || value;
}

export function priorityLabel(priority: string): string {
  if (!priority) return "—";
  // "2 - High" → "P2"; "3 - Moderate" → "P3". Falls back to the raw label if it isn't numbered.
  const match = /^(\d+)/.exec(priority);
  return match ? `P${match[1]}` : priority;
}
