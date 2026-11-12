import "server-only";
import { randomBytes } from "node:crypto";
import type { ParentRole } from "@/lib/roles";
import { GATE_LIMITS } from "@/lib/gate-rules";
import { getDb, sha256 } from "./db";

/**
 * Server side of the room entry gate (rooms 2-7).
 *
 * A VISIT is one stay on a room page in one tab (client-generated random id). Within a
 * visit the parent may record several times; each recording is an ATTEMPT with a
 * client-generated, strictly increasing sequence number (`seq`, based on the device clock).
 *
 *   1. createAttempt  - on 녹음 시작하기. The session remembers the newest seq. A request
 *                       with an older or equal seq is STALE (a late request from an earlier
 *                       screen) and changes nothing. A newer one replaces every other
 *                       attempt and grant of the session -- this is also what makes
 *                       "entering another room invalidates the previous grant" hold.
 *   2. enterRoom      - after recording -> stop -> full playback -> confirm. Consumes the
 *                       attempt (one-time) and issues a short-lived grant for this
 *                       session + room + visit. The room body is returned only here.
 *   3. verifyGrant    - used by in-room server actions (rooms 4-7 writing, room 7 proposals).
 *   4. leaveVisit     - leaving / hiding the page: deletes only THIS visit's attempt/grant,
 *                       so a late "leave" from an old screen can never cancel a new visit.
 *      revokeSession  - logout: deletes everything of the session.
 *
 * Only SHA-256 hashes of attempt/grant ids are stored. Nothing about the audio reaches
 * the server. The server cannot verify what was said or that it was listened to; it
 * only checks that this specific attempt was completed in a plausible time. A modified
 * client can fake those reports -- this is a commitment ritual, not a security boundary
 * for the content (authentication is). There is no permanent "skip recording" flag.
 */

export type SessionRef = { sid: string; role: ParentRole };

const newId = () => randomBytes(24).toString("base64url");
const VISIT_RE = /^[A-Za-z0-9_-]{8,64}$/;
/** seq is a device-clock timestamp (ms); it must be roughly "now" so it cannot pin the session forever. */
const SEQ_WINDOW_MS = 24 * 60 * 60_000;

export const isVisitId = (v: unknown): v is string => typeof v === "string" && VISIT_RE.test(v);
export const isSeq = (v: unknown, now = Date.now()): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && Math.abs(v - now) <= SEQ_WINDOW_MS;

function sweep(now: number) {
  const db = getDb();
  db.prepare("DELETE FROM room_attempts WHERE created_at < ?").run(now - GATE_LIMITS.attemptTtlMs);
  db.prepare("DELETE FROM room_grants WHERE expires_at <= ?").run(now);
}

/** Logout: everything of this session. */
export function revokeSession(sid: string): void {
  const db = getDb();
  db.prepare("DELETE FROM room_attempts WHERE sid = ?").run(sid);
  db.prepare("DELETE FROM room_grants WHERE sid = ?").run(sid);
}

/**
 * Leaving one visit (page hidden / left / back to preparation / re-record cleanup).
 * With attemptId only that attempt is removed; otherwise the visit's attempt and grant.
 * Never touches other visits.
 */
export function leaveVisit(session: SessionRef, visitId: string, attemptId?: string): void {
  const db = getDb();
  if (attemptId) {
    db.prepare("DELETE FROM room_attempts WHERE id_hash = ? AND sid = ? AND visit_id = ?").run(sha256(attemptId), session.sid, visitId);
    return;
  }
  db.prepare("DELETE FROM room_attempts WHERE sid = ? AND visit_id = ?").run(session.sid, visitId);
  db.prepare("DELETE FROM room_grants WHERE sid = ? AND visit_id = ?").run(session.sid, visitId);
}

export type AttemptResult = { ok: true; attemptId: string } | { ok: false; reason: "stale" | "bad_request" };

export function createAttempt(session: SessionRef, roomId: number, visitId: unknown, seq: unknown, now = Date.now()): AttemptResult {
  if (!isVisitId(visitId) || !isSeq(seq, now)) return { ok: false, reason: "bad_request" };
  const db = getDb();
  sweep(now);
  db.exec("BEGIN IMMEDIATE");
  try {
    // Only a request newer than every earlier one of this session may proceed.
    const advanced = db.prepare("UPDATE sessions SET gate_seq = ? WHERE sid = ? AND gate_seq < ?").run(seq, session.sid, seq);
    if (Number(advanced.changes) !== 1) {
      db.exec("ROLLBACK");
      return { ok: false, reason: "stale" };
    }
    // Newest wins: every older attempt and grant of this session (any room, any visit) ends here.
    db.prepare("DELETE FROM room_attempts WHERE sid = ?").run(session.sid);
    db.prepare("DELETE FROM room_grants WHERE sid = ?").run(session.sid);
    const id = newId();
    db.prepare("INSERT INTO room_attempts (id_hash, sid, role, room_id, created_at, visit_id, seq) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      sha256(id),
      session.sid,
      session.role,
      roomId,
      now,
      visitId,
      seq,
    );
    db.exec("COMMIT");
    return { ok: true, attemptId: id };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export type EnterResult =
  | { ok: true; grant: string; expiresAt: number }
  | { ok: false; reason: "invalid_attempt" | "used" | "expired" | "too_fast" | "bad_report" };

export function enterRoom(
  session: SessionRef,
  roomId: number,
  visitId: unknown,
  attemptId: unknown,
  recordedMs: unknown,
  now = Date.now(),
): EnterResult {
  if (typeof attemptId !== "string" || attemptId.length > 64 || !isVisitId(visitId)) return { ok: false, reason: "invalid_attempt" };
  if (
    typeof recordedMs !== "number" ||
    !Number.isFinite(recordedMs) ||
    recordedMs < GATE_LIMITS.minRecordMs ||
    recordedMs > GATE_LIMITS.maxRecordMs + 2000
  ) {
    return { ok: false, reason: "bad_report" };
  }

  const db = getDb();
  const idHash = sha256(attemptId);
  const found = db.prepare("SELECT sid, role, room_id, created_at, visit_id FROM room_attempts WHERE id_hash = ?").get(idHash) as
    | { sid: string; role: ParentRole; room_id: number; created_at: number; visit_id: string }
    | undefined;
  // Wrong session, account, room or visit, a consumed attempt, or one replaced by a newer
  // attempt (deleted) are all indistinguishable to the caller.
  if (!found || found.sid !== session.sid || found.role !== session.role || found.room_id !== roomId || found.visit_id !== visitId) {
    return { ok: false, reason: "invalid_attempt" };
  }
  if (now - found.created_at > GATE_LIMITS.attemptTtlMs) {
    db.prepare("DELETE FROM room_attempts WHERE id_hash = ?").run(idHash);
    return { ok: false, reason: "expired" };
  }
  // Recording + full playback both take at least the recording length.
  const minElapsed = Math.floor(recordedMs * 2 * GATE_LIMITS.elapsedTolerance);
  if (now - found.created_at < minElapsed) return { ok: false, reason: "too_fast" };

  // Consume atomically: only one request can delete the row.
  if (Number(db.prepare("DELETE FROM room_attempts WHERE id_hash = ?").run(idHash).changes) !== 1) {
    return { ok: false, reason: "used" };
  }
  const grant = newId();
  const expiresAt = now + GATE_LIMITS.grantTtlMs;
  db.prepare("INSERT INTO room_grants (id_hash, sid, role, room_id, expires_at, visit_id) VALUES (?, ?, ?, ?, ?, ?)").run(
    sha256(grant),
    session.sid,
    session.role,
    roomId,
    expiresAt,
    visitId,
  );
  return { ok: true, grant, expiresAt };
}

/** For in-room server actions. Never extends a grant and never applies to another room, session or account. */
export function verifyGrant(session: SessionRef, roomId: number, grantId: unknown, now = Date.now()): boolean {
  if (typeof grantId !== "string" || grantId.length === 0 || grantId.length > 64) return false;
  const gr = getDb().prepare("SELECT sid, role, room_id, expires_at FROM room_grants WHERE id_hash = ?").get(sha256(grantId)) as
    | { sid: string; role: ParentRole; room_id: number; expires_at: number }
    | undefined;
  if (!gr || gr.expires_at <= now) return false;
  return gr.sid === session.sid && gr.role === session.role && gr.room_id === roomId;
}

export const GRANT_HEADER = "x-room-grant";

export function __resetRoomAccessForTests(): void {
  getDb().exec("DELETE FROM room_attempts; DELETE FROM room_grants;");
}
