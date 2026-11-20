import "server-only";
import { cache } from "react";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectorRequest, type ConnectorConnection } from "../connector";
import { ServiceNowError } from "./errors";
import { SESSION_COOKIE } from "./cookies";

/** Only an opaque connection reference lives in the browser. OAuth tokens live in PostgreSQL. */
export type Connection = { id: string; subdomain: string; host: string };
const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;
function encryptionKey(): Buffer {
  const secret = process.env.SRENITY_SESSION_SECRET ?? process.env.SRENITY_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new ServiceNowError("unknown", "Set SRENITY_SESSION_SECRET to configure connections.");
  return createHash("sha256").update(secret).digest();
}
export async function saveSession(connection: ConnectorConnection): Promise<void> {
  const host = new URL(connection.instance_url).host;
  const payload: Connection = { id: connection.id, host, subdomain: host.split(".")[0]! };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const value = [iv, cipher.getAuthTag(), ciphertext].map(p => p.toString("base64url")).join(".");
  (await cookies()).set(SESSION_COOKIE.connection, value, { ...options, maxAge: 60 * 60 * 24 * 7 });
}
export async function clearSession(): Promise<void> { (await cookies()).delete(SESSION_COOKIE.connection); }
export async function readSelectedReference(): Promise<Connection | null> {
  const value = (await cookies()).get(SESSION_COOKIE.connection)?.value;
  if (!value) return null;
  let payload: Connection;
  try {
    const parts = value.split(".");
    if (parts.length !== 3) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(parts[0]!, "base64url"));
    decipher.setAuthTag(Buffer.from(parts[1]!, "base64url"));
    payload = JSON.parse(Buffer.concat([decipher.update(Buffer.from(parts[2]!, "base64url")), decipher.final()]).toString("utf8")) as Connection;
    if (!/^[a-f0-9-]{36}$/i.test(payload.id ?? "")) return null;
    return payload;
  } catch { return null; }
}

export const readConnection = cache(async (): Promise<Connection | null> => {
  const payload = await readSelectedReference();
  if (!payload) return null;
  try {
    const saved = await connectorRequest<ConnectorConnection>(`/connections/${payload.id}`);
    return saved.provider_id === "servicenow" && saved.status === "connected" ? payload : null;
  } catch (error) {
    if (error instanceof ServiceNowError && error.code === "not_found") return null;
    throw error;
  }
});
export async function requireConnection(): Promise<Connection> {
  const connection = await readConnection();
  if (!connection) throw new ServiceNowError("auth_failed", "Connect a ServiceNow instance to continue.");
  return connection;
}
