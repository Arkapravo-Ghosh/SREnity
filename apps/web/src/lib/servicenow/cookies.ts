export const SESSION_COOKIE = {
  connection: "srenity_sn",
  // Opaque OAuth state only. PKCE verifier is encrypted in the connector database.
  flow: "srenity_sn_flow",
} as const;
