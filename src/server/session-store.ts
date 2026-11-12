import "server-only";
import { getDb } from "./db";
import type { SessionPayload } from "./session-token";

/**
 * Server-side record of each login. A signed cookie is accepted only while its
 * record exists, is not revoked and has not expired, so logout ends the session
 * even if someone kept a copy of the cookie. No device data is stored.
 */

export function recordSession(p: SessionPayload, now = Date.now()): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now - 24 * 60 * 60_000);
  db.prepare("INSERT INTO sessions (sid, role, created_at, expires_at) VALUES (?, ?, ?, ?)").run(p.sid, p.role, p.iat * 1000, p.exp * 1000);
}

export function isSessionActive(p: SessionPayload, now = Date.now()): boolean {
  const r = getDb().prepare("SELECT role, expires_at, revoked_at FROM sessions WHERE sid = ?").get(p.sid) as
    | { role: string; expires_at: number; revoked_at: number | null }
    | undefined;
  return !!r && r.role === p.role && r.revoked_at === null && r.expires_at > now;
}

export function revokeSessionRecord(sid: string, now = Date.now()): void {
  getDb().prepare("UPDATE sessions SET revoked_at = ? WHERE sid = ? AND revoked_at IS NULL").run(now, sid);
}
