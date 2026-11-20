/**
 * ServiceNow failures are surfaced to users, never as stack traces. Every throw from this
 * package is a ServiceNowError, so callers can branch on `code` instead of parsing strings.
 */
export type ServiceNowErrorCode =
  | "invalid_instance" // the URL the user typed isn't a ServiceNow instance we can reach
  | "unreachable" // DNS/TLS/timeout — the instance never answered
  | "auth_failed" // token exchange rejected: bad client id/secret, or the user denied consent
  | "forbidden" // authenticated, but the account lacks read access to the table
  | "not_found" // the record doesn't exist, or the account can't see it
  | "rate_limited" // instance is throttling us
  | "bad_response" // answered, but not the shape we expect
  | "unknown";

export class ServiceNowError extends Error {
  readonly code: ServiceNowErrorCode;
  readonly status?: number;
  /** Safe to show to the end user. Never contains tokens, secrets or the raw upstream body. */
  readonly userMessage: string;

  constructor(
    code: ServiceNowErrorCode,
    userMessage: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(`${code}: ${userMessage}`, { cause: options.cause });
    this.name = "ServiceNowError";
    this.code = code;
    this.status = options.status;
    this.userMessage = userMessage;
  }
}

export function isServiceNowError(error: unknown): error is ServiceNowError {
  return error instanceof ServiceNowError;
}

/**
 * Normalizes an unknown thrown value into something safe to render. Anything that isn't a
 * ServiceNowError is collapsed to a generic message so an unexpected exception can't leak
 * internals (or upstream response bodies) into the UI.
 */
export function toUserMessage(error: unknown): string {
  if (isServiceNowError(error)) return error.userMessage;
  return "Something went wrong contacting the connector. Try again in a moment.";
}
