import "server-only";
import { isParentRole, type Role } from "@/lib/roles";
import { getAdminPassword, getParentPassword, getSessionSecret } from "./config";
import { lockRemainingMs, recordFailure, recordSuccess } from "./rate-limit";
import { recordSession } from "./session-store";
import { createSessionToken, secretsMatch, type SessionPayload } from "./session-token";

/**
 * Login decision logic, independent of HTTP so it can be unit tested.
 * The account a session gets is decided here from which configured secret
 * matched -- never from a client-provided role field alone.
 */

export type LoginResult =
  | { ok: true; token: string; payload: SessionPayload }
  | { ok: false; reason: "invalid_request" }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "locked"; retryAfterSeconds: number }
  | { ok: false; reason: "wrong"; remaining: number };

const PARENT_CODE = /^\d{1,12}$/;
const MAX_ADMIN_INPUT = 256;

function attempt(account: Role, submitted: string, configured: string | null, client: string): LoginResult {
  const secret = getSessionSecret();
  if (!secret || !configured) return { ok: false, reason: "not_configured" };

  const wait = lockRemainingMs(account, client);
  if (wait > 0) return { ok: false, reason: "locked", retryAfterSeconds: Math.ceil(wait / 1000) };

  if (!secretsMatch(submitted, configured, secret)) {
    const remaining = recordFailure(account, client);
    if (remaining === 0) {
      const lockWait = lockRemainingMs(account, client);
      return { ok: false, reason: "locked", retryAfterSeconds: Math.ceil(lockWait / 1000) };
    }
    return { ok: false, reason: "wrong", remaining };
  }

  recordSuccess(account, client);
  const { token, payload } = createSessionToken(account, secret);
  recordSession(payload);
  return { ok: true, token, payload };
}

export function attemptParentLogin(role: unknown, password: unknown, client: string): LoginResult {
  if (!isParentRole(role) || typeof password !== "string" || !PARENT_CODE.test(password)) {
    return { ok: false, reason: "invalid_request" };
  }
  return attempt(role, password, getParentPassword(role), client);
}

export function attemptAdminLogin(password: unknown, client: string): LoginResult {
  if (typeof password !== "string" || password.length === 0 || password.length > MAX_ADMIN_INPUT) {
    return { ok: false, reason: "invalid_request" };
  }
  return attempt("son", password, getAdminPassword(), client);
}
