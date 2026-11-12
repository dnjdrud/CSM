import "server-only";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Single-file SQLite store (Node's built-in node:sqlite, no extra dependency).
 * Suitable for one long-running server. Serverless / multi-instance hosting
 * needs a separate persistent database (see README).
 *
 * Location: FAMILY_DB_PATH, default ./data/family.db (gitignored).
 * There is deliberately NO table for entry recordings.
 * Short-lived security state (sessions, login lockouts, room entry attempts/grants) is
 * stored here too, so a restart keeps lockouts and logouts effective.
 */

let db: DatabaseSync | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS keyrings (
  owner       TEXT PRIMARY KEY CHECK (owner IN ('mother','father')),
  kdf         TEXT NOT NULL,
  iterations  INTEGER NOT NULL,
  salt        TEXT NOT NULL,
  check_iv    TEXT NOT NULL,
  check_ct    TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS entries (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('mother','father')),
  room_id     INTEGER NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('sealed','shared')),
  title       TEXT,
  body        TEXT,
  iv          TEXT,
  ciphertext  TEXT,
  shared_at   INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  -- sealed (나만 간직하기 / 초안): only ciphertext, never a plaintext title or body.
  CHECK (
    (kind = 'sealed' AND title IS NULL AND body IS NULL AND iv IS NOT NULL AND ciphertext IS NOT NULL AND shared_at IS NULL) OR
    (kind = 'shared' AND body IS NOT NULL AND iv IS NULL AND ciphertext IS NULL AND shared_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS entries_owner ON entries(owner, room_id);
CREATE INDEX IF NOT EXISTS entries_shared ON entries(kind, shared_at);
CREATE TABLE IF NOT EXISTS proposals (
  id           TEXT PRIMARY KEY,
  owner        TEXT NOT NULL CHECK (owner IN ('mother','father')),
  method       TEXT NOT NULL CHECK (method IN ('call','meet','with_someone')),
  proposed_at  INTEGER,
  timezone     TEXT NOT NULL CHECK (timezone = 'Asia/Seoul'),
  location     TEXT NOT NULL DEFAULT '',
  companion    TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL CHECK (status IN ('proposed','accepted','other_time','cancelled')),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS proposals_owner ON proposals(owner, created_at);

-- Accounts. Credentials are NOT stored here: login codes live only in server env vars.
CREATE TABLE IF NOT EXISTS users (
  role        TEXT PRIMARY KEY CHECK (role IN ('mother','father','son')),
  created_at  INTEGER NOT NULL
);
INSERT OR IGNORE INTO users (role, created_at) VALUES ('mother', 0), ('father', 0), ('son', 0);

-- Server-side session records: logout really ends a session (the signed cookie alone is not enough).
CREATE TABLE IF NOT EXISTS sessions (
  sid         TEXT PRIMARY KEY,
  role        TEXT NOT NULL REFERENCES users(role),
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  revoked_at  INTEGER
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

-- Login failure counters. key = bucket kind + account + SHA-256 of the client address (never the raw address).
CREATE TABLE IF NOT EXISTS login_buckets (
  key           TEXT PRIMARY KEY,
  failures      INTEGER NOT NULL,
  window_start  INTEGER NOT NULL,
  locked_until  INTEGER NOT NULL
);

-- Room entry gate. Only SHA-256 hashes of the one-time ids are stored. No audio, ever.
-- Grants are short-lived, per session and per room; there is no permanent "skip recording" flag.
CREATE TABLE IF NOT EXISTS room_attempts (
  id_hash     TEXT PRIMARY KEY,
  sid         TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('mother','father')),
  room_id     INTEGER NOT NULL CHECK (room_id BETWEEN 2 AND 7),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS room_attempts_sid ON room_attempts(sid);
CREATE TABLE IF NOT EXISTS room_grants (
  id_hash     TEXT PRIMARY KEY,
  sid         TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('mother','father')),
  room_id     INTEGER NOT NULL CHECK (room_id BETWEEN 2 AND 7),
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS room_grants_sid ON room_grants(sid);

-- Son's edits of letters/cards (ContentDraft). published_json NULL = not shown to parents.
CREATE TABLE IF NOT EXISTS content_versions (
  key           TEXT PRIMARY KEY,
  draft_json    TEXT NOT NULL,
  published_json TEXT,
  updated_at    INTEGER NOT NULL,
  published_at  INTEGER
);
`;

/** Columns added after a table was first created (older dev databases). */
const ADDED_COLUMNS: [table: string, column: string, ddl: string][] = [
  ["proposals", "son_message", "ALTER TABLE proposals ADD COLUMN son_message TEXT NOT NULL DEFAULT ''"],
  ["proposals", "son_proposed_at", "ALTER TABLE proposals ADD COLUMN son_proposed_at INTEGER"],
  ["proposals", "answered_at", "ALTER TABLE proposals ADD COLUMN answered_at INTEGER"],
  ["proposals", "cancelled_by", "ALTER TABLE proposals ADD COLUMN cancelled_by TEXT CHECK (cancelled_by IN ('parent','son'))"],
  // Gate: attempts/grants belong to one visit (one stay on a room page); the session keeps the newest
  // attempt sequence so late, older requests can be recognised and ignored.
  ["room_attempts", "visit_id", "ALTER TABLE room_attempts ADD COLUMN visit_id TEXT NOT NULL DEFAULT ''"],
  ["room_attempts", "seq", "ALTER TABLE room_attempts ADD COLUMN seq INTEGER NOT NULL DEFAULT 0"],
  ["room_grants", "visit_id", "ALTER TABLE room_grants ADD COLUMN visit_id TEXT NOT NULL DEFAULT ''"],
  ["sessions", "gate_seq", "ALTER TABLE sessions ADD COLUMN gate_seq INTEGER NOT NULL DEFAULT 0"],
];

function migrate(d: DatabaseSync) {
  d.exec(SCHEMA);
  for (const [table, column, ddl] of ADDED_COLUMNS) {
    const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) d.exec(ddl);
  }
}

export function dbPath(): string {
  return process.env.FAMILY_DB_PATH?.trim() || join(process.cwd(), "data", "family.db");
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = dbPath();
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;");
  migrate(db);
  return db;
}

/** Tests only: start from an empty in-memory database. */
export function __useMemoryDbForTests() {
  db?.close();
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
}

/** One-way hash for bearer ids and client addresses stored in the database. */
export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("base64url");
}
