/** Which SREnity OAuth client this site uses. Loopback hosts use the local-development client. */
export type SetupVariant = "prod" | "local";

export function setupVariant(origin: string): SetupVariant {
  try {
    const host = new URL(origin).hostname;
    return host === "127.0.0.1" || host === "localhost" ? "local" : "prod";
  } catch {
    return "prod";
  }
}

export type SetupCheck = {
  status: "ready" | "not_installed" | "redirect_mismatch" | "unreachable";
  ready: boolean;
  variant: SetupVariant;
  instance: string;
  message: string;
};
