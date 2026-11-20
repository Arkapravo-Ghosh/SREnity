"use server";

import "server-only";

/** The browser invokes this action; connector URL and credentials stay on the server. */
export async function submitEnquiry(formData: FormData): Promise<{ success: boolean }> {
  if (formData.get("_honey")) return { success: true };
  const email = formData.get("email");
  const role = formData.get("role");
  if (typeof email !== "string" || typeof role !== "string") return { success: false };
  const leadEmail = email.trim();
  const leadRole = role.trim();
  if (
    leadEmail.length > 254 || !/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(leadEmail) ||
    !leadRole || leadRole.length > 120
  ) return { success: false };

  const baseUrl = process.env.SRENITY_CONNECTOR_URL;
  const apiKey = process.env.ENQUIRY_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("Enquiry connector configuration is missing.");
    return { success: false };
  }
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ email: leadEmail, role: leadRole }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) return { success: false };
    const result = await response.json();
    return { success: result?.success === true };
  } catch {
    console.error("Enquiry connector request failed.");
    return { success: false };
  }
}
