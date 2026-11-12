import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ParentRole } from "@/lib/roles";
import { getSessionSecret, isProduction } from "./config";
import { isSessionActive } from "./session-store";
import { verifySessionToken, type SessionPayload } from "./session-token";

/**
 * Data Access Layer for the session. Every page, route handler and (later)
 * content API must call one of the require* helpers close to the data.
 */

export const SESSION_COOKIE = "fh_session";
/** Per-role so a shared phone still shows each parent their own first-visit intro. */
export const introCookieName = (role: ParentRole) => `fh_intro_${role}`;

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict" as const,
    path: "/",
    // Bounded by the server-side exp in the signed payload as well.
    maxAge: maxAgeSeconds,
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token, secret);
  // Signature + expiry are not enough: the server-side record must still be active (not logged out).
  return payload && isSessionActive(payload) ? payload : null;
}

export type ParentSession = SessionPayload & { role: ParentRole };

export async function requireParent(): Promise<ParentSession> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "son") redirect("/admin");
  return s as ParentSession;
}

/** For route handlers: returns null instead of redirecting. */
export async function getParentSession(): Promise<ParentSession | null> {
  const s = await getSession();
  return s && s.role !== "son" ? (s as ParentSession) : null;
}

export async function requireAdmin(): Promise<SessionPayload & { role: "son" }> {
  const s = await getSession();
  if (!s || s.role !== "son") redirect("/admin/login");
  return s as SessionPayload & { role: "son" };
}

/**
 * Opaque per-login value for binding the in-tab personal-password key to THIS login
 * (parent + session). Derived one-way from the session id; reveals nothing usable.
 */
export function vaultScopeFor(s: SessionPayload | null): string | null {
  if (!s || s.role === "son") return null;
  return createHash("sha256").update(`vault-scope:${s.sid}:${s.role}`).digest("base64url").slice(0, 22);
}

/** Non-sensitive UI preference: has this browser finished the first-visit intro? */
export async function hasSeenIntro(role: ParentRole): Promise<boolean> {
  return (await cookies()).get(introCookieName(role))?.value === "1";
}

export function introCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
