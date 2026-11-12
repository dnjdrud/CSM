import "server-only";
import { randomUUID } from "node:crypto";
import type { ParentRole } from "@/lib/roles";
import {
  ENTRY_LIMITS,
  isBase64,
  isWritableRoom,
  normalizeText,
  validatePlain,
  type OwnEntry,
} from "@/lib/entry-rules";
import { getDb } from "./db";

/**
 * Parents' own writing.
 *  - sealed  = 나만 간직하기 / 초안: the browser encrypts with the parent's personal password
 *              (Web Crypto). The server only ever receives and stores ciphertext.
 *  - shared  = 아들에게 전하기: plaintext, stored only after the writer's final confirmation.
 * Every query is scoped by owner. The son (admin) can read shared entries only.
 */

export type EntryInput =
  | { kind: "sealed"; roomId: number; iv: string; ciphertext: string }
  | { kind: "shared"; roomId: number; title: string; body: string };

export type InputError = "invalid_request" | "room_not_writable" | "body_required" | "title_too_long" | "body_too_long" | "confirm_required";

/** Parses an untrusted request body. Sharing requires an explicit final confirmation flag. */
export function parseEntryInput(raw: unknown): { ok: true; input: EntryInput } | { ok: false; error: InputError } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_request" };
  const r = raw as Record<string, unknown>;
  if (!isWritableRoom(r.roomId)) return { ok: false, error: "room_not_writable" };
  if (r.kind === "sealed") {
    // A sealed entry must never carry plaintext alongside it.
    if ("title" in r || "body" in r) return { ok: false, error: "invalid_request" };
    if (!isBase64(r.iv, 24) || !isBase64(r.ciphertext, ENTRY_LIMITS.ciphertextMax)) return { ok: false, error: "invalid_request" };
    return { ok: true, input: { kind: "sealed", roomId: r.roomId, iv: r.iv, ciphertext: r.ciphertext } };
  }
  if (r.kind === "shared") {
    if (r.confirmShare !== true) return { ok: false, error: "confirm_required" };
    if (typeof r.title !== "string" || typeof r.body !== "string") return { ok: false, error: "invalid_request" };
    const v = validatePlain(r.title, r.body);
    if (v !== "ok") return { ok: false, error: v };
    return { ok: true, input: { kind: "shared", roomId: r.roomId, title: normalizeText(r.title), body: normalizeText(r.body) } };
  }
  return { ok: false, error: "invalid_request" };
}

type Row = {
  id: string;
  owner: ParentRole;
  room_id: number;
  kind: "sealed" | "shared";
  title: string | null;
  body: string | null;
  iv: string | null;
  ciphertext: string | null;
  shared_at: number | null;
  created_at: number;
  updated_at: number;
};

function toOwnEntry(r: Row): OwnEntry {
  return r.kind === "sealed"
    ? { id: r.id, roomId: r.room_id, kind: "sealed", iv: r.iv!, ciphertext: r.ciphertext!, createdAt: r.created_at, updatedAt: r.updated_at }
    : {
        id: r.id,
        roomId: r.room_id,
        kind: "shared",
        title: r.title ?? "",
        body: r.body!,
        sharedAt: r.shared_at!,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
}

export function listOwnEntries(owner: ParentRole): OwnEntry[] {
  const rows = getDb()
    .prepare("SELECT * FROM entries WHERE owner = ? ORDER BY created_at DESC")
    .all(owner) as unknown as Row[];
  return rows.map(toOwnEntry);
}

function columns(input: EntryInput, now: number, prevSharedAt: number | null) {
  return input.kind === "sealed"
    ? { kind: "sealed", title: null, body: null, iv: input.iv, ciphertext: input.ciphertext, shared_at: null }
    : { kind: "shared", title: input.title, body: input.body, iv: null, ciphertext: null, shared_at: prevSharedAt ?? now };
}

export function createEntry(owner: ParentRole, input: EntryInput, now = Date.now()): { ok: true; entry: OwnEntry } | { ok: false; error: "limit" } {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS n FROM entries WHERE owner = ?").get(owner) as { n: number }).n;
  if (count >= ENTRY_LIMITS.perOwnerMax) return { ok: false, error: "limit" };
  const id = randomUUID();
  const c = columns(input, now, null);
  db.prepare(
    `INSERT INTO entries (id, owner, room_id, kind, title, body, iv, ciphertext, shared_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, owner, input.roomId, c.kind, c.title, c.body, c.iv, c.ciphertext, c.shared_at, now, now);
  return { ok: true, entry: toOwnEntry(db.prepare("SELECT * FROM entries WHERE id = ?").get(id) as unknown as Row) };
}

/**
 * Replaces an entry's content (고쳐 쓰기, 나만 간직하기 <-> 아들에게 전하기).
 * Only the owner can do this; another parent's id behaves exactly like a missing id.
 */
export function replaceEntry(owner: ParentRole, id: string, input: EntryInput, now = Date.now()): OwnEntry | null {
  const db = getDb();
  const prev = db.prepare("SELECT * FROM entries WHERE id = ? AND owner = ?").get(id, owner) as unknown as Row | undefined;
  if (!prev || prev.room_id !== input.roomId) return null;
  const c = columns(input, now, prev.kind === "shared" ? prev.shared_at : null);
  db.prepare(
    `UPDATE entries SET kind = ?, title = ?, body = ?, iv = ?, ciphertext = ?, shared_at = ?, updated_at = ?
     WHERE id = ? AND owner = ?`,
  ).run(c.kind, c.title, c.body, c.iv, c.ciphertext, c.shared_at, now, id, owner);
  return toOwnEntry(db.prepare("SELECT * FROM entries WHERE id = ?").get(id) as unknown as Row);
}

export function deleteEntry(owner: ParentRole, id: string): boolean {
  return Number(getDb().prepare("DELETE FROM entries WHERE id = ? AND owner = ?").run(id, owner).changes) > 0;
}

// ---- Son (admin): shared entries only. Sealed entries are not even counted. ----

export type SharedForSon = { id: string; owner: ParentRole; roomId: number; title: string; sharedAt: number; updatedAt: number };

/** List without bodies, so nothing is shown automatically. */
export function listSharedForSon(): SharedForSon[] {
  const rows = getDb()
    .prepare("SELECT id, owner, room_id, title, shared_at, updated_at FROM entries WHERE kind = 'shared' ORDER BY shared_at DESC")
    .all() as unknown as Row[];
  return rows.map((r) => ({ id: r.id, owner: r.owner, roomId: r.room_id, title: r.title ?? "", sharedAt: r.shared_at!, updatedAt: r.updated_at }));
}

export function getSharedForSon(id: string): (SharedForSon & { body: string }) | null {
  const r = getDb().prepare("SELECT * FROM entries WHERE id = ? AND kind = 'shared'").get(id) as unknown as Row | undefined;
  if (!r) return null;
  return { id: r.id, owner: r.owner, roomId: r.room_id, title: r.title ?? "", body: r.body!, sharedAt: r.shared_at!, updatedAt: r.updated_at };
}

// ---- Personal password keyring (salt + verifier, no key, no password) ----

export type Keyring = { kdf: "PBKDF2-SHA256"; iterations: number; salt: string; checkIv: string; checkCt: string };

export function getKeyring(owner: ParentRole): Keyring | null {
  const r = getDb().prepare("SELECT * FROM keyrings WHERE owner = ?").get(owner) as
    | { kdf: string; iterations: number; salt: string; check_iv: string; check_ct: string }
    | undefined;
  return r ? { kdf: "PBKDF2-SHA256", iterations: r.iterations, salt: r.salt, checkIv: r.check_iv, checkCt: r.check_ct } : null;
}

export const MIN_KDF_ITERATIONS = 600_000;

export function parseKeyring(raw: unknown): Keyring | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.kdf !== "PBKDF2-SHA256") return null;
  if (typeof r.iterations !== "number" || !Number.isInteger(r.iterations) || r.iterations < MIN_KDF_ITERATIONS || r.iterations > 10_000_000) return null;
  if (!isBase64(r.salt, 64) || !isBase64(r.checkIv, 24) || !isBase64(r.checkCt, 200)) return null;
  return { kdf: "PBKDF2-SHA256", iterations: r.iterations, salt: r.salt, checkIv: r.checkIv, checkCt: r.checkCt };
}

/** Creates the keyring once. Returns false if one already exists (no silent overwrite). */
export function createKeyring(owner: ParentRole, k: Keyring, now = Date.now()): boolean {
  const res = getDb()
    .prepare(
      `INSERT OR IGNORE INTO keyrings (owner, kdf, iterations, salt, check_iv, check_ct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(owner, k.kdf, k.iterations, k.salt, k.checkIv, k.checkCt, now);
  return Number(res.changes) > 0;
}

/**
 * 개인 비밀번호를 잊었을 때: the sealed entries can never be decrypted again, so they are
 * deleted together with the keyring. Shared entries are untouched.
 */
export function resetKeyring(owner: ParentRole): { deletedSealed: number } {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const del = db.prepare("DELETE FROM entries WHERE owner = ? AND kind = 'sealed'").run(owner);
    db.prepare("DELETE FROM keyrings WHERE owner = ?").run(owner);
    db.exec("COMMIT");
    return { deletedSealed: Number(del.changes) };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
