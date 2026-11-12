import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/roles";

/**
 * Signed (HMAC-SHA256) session token. Pure functions so they can be unit tested.
 * Token = base64url(JSON payload) + "." + base64url(HMAC(secret, payloadPart))
 *
 * The payload contains no personal data: only a random session id, role and times.
 * The role is written ONLY by the server after a password check succeeded.
 */

export type SessionPayload = {
  v: 1;
  sid: string;
  role: Role;
  iat: number; // seconds
  exp: number; // seconds
};

export const PARENT_SESSION_SECONDS = 12 * 60 * 60;
export const ADMIN_SESSION_SECONDS = 2 * 60 * 60;

const ROLES: readonly Role[] = ["mother", "father", "son"];

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(part: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(part).digest());
}

export function createSessionToken(
  role: Role,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { token: string; payload: SessionPayload } {
  const ttl = role === "son" ? ADMIN_SESSION_SECONDS : PARENT_SESSION_SECONDS;
  const payload: SessionPayload = {
    v: 1,
    sid: b64url(randomBytes(18)),
    role,
    iat: nowSeconds,
    exp: nowSeconds + ttl,
  };
  const part = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return { token: `${part}.${sign(part, secret)}`, payload };
}

export function verifySessionToken(
  token: string | undefined | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  if (!token || token.length > 1024) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const part = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  const expected = Buffer.from(sign(part, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const p = data as Record<string, unknown>;
  if (p.v !== 1) return null;
  if (typeof p.sid !== "string" || p.sid.length < 16) return null;
  if (!ROLES.includes(p.role as Role)) return null;
  if (typeof p.iat !== "number" || typeof p.exp !== "number") return null;
  if (p.iat > nowSeconds + 60) return null; // issued in the future
  if (p.exp <= nowSeconds) return null; // expired
  return { v: 1, sid: p.sid, role: p.role as Role, iat: p.iat, exp: p.exp };
}

/**
 * Constant-time comparison of a submitted secret with the configured one.
 * Both sides are HMAC'd first so lengths are equal and nothing leaks via timing.
 */
export function secretsMatch(submitted: string, configured: string, key: string): boolean {
  const a = createHmac("sha256", key).update(submitted, "utf8").digest();
  const b = createHmac("sha256", key).update(configured, "utf8").digest();
  return timingSafeEqual(a, b);
}
