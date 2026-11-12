import "server-only";

/**
 * Login attempt limiter (failures only).
 *
 * Two buckets per account:
 *  - per account + client IP: few failures, short lock
 *  - per account across all IPs: protects short numeric codes even if the
 *    client IP header is spoofed or rotates
 *
 * Stored in SQLite (login_buckets), so a restart does not clear a lock. Keys contain a
 * SHA-256 of the client address, never the address itself.
 */
import { getDb, sha256 } from "./db";

type Bucket = { failures: number; windowStart: number; lockedUntil: number };

export type LimitRule = { maxFailures: number; windowMs: number; lockMs: number };

export const RULES = {
  perClient: { maxFailures: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 },
  perAccount: { maxFailures: 20, windowMs: 60 * 60_000, lockMs: 60 * 60_000 },
} satisfies Record<string, LimitRule>;

function getBucket(key: string, rule: LimitRule, now: number): Bucket {
  const row = getDb().prepare("SELECT failures, window_start, locked_until FROM login_buckets WHERE key = ?").get(key) as
    | { failures: number; window_start: number; locked_until: number }
    | undefined;
  if (!row || (now - row.window_start > rule.windowMs && row.locked_until <= now)) {
    return { failures: 0, windowStart: now, lockedUntil: 0 };
  }
  return { failures: row.failures, windowStart: row.window_start, lockedUntil: row.locked_until };
}

function saveBucket(key: string, b: Bucket) {
  getDb()
    .prepare(
      `INSERT INTO login_buckets (key, failures, window_start, locked_until) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET failures = excluded.failures, window_start = excluded.window_start, locked_until = excluded.locked_until`,
    )
    .run(key, b.failures, b.windowStart, b.lockedUntil);
}

const clientKey = (account: string, clientId: string) => `c:${account}:${sha256(clientId)}`;

function keys(account: string, clientId: string) {
  return [
    { key: clientKey(account, clientId), rule: RULES.perClient },
    { key: `a:${account}`, rule: RULES.perAccount },
  ];
}

/** Returns ms until the account may try again, or 0 when allowed. */
export function lockRemainingMs(account: string, clientId: string, now = Date.now()): number {
  let wait = 0;
  for (const { key, rule } of keys(account, clientId)) {
    const b = getBucket(key, rule, now);
    if (b.lockedUntil > now) wait = Math.max(wait, b.lockedUntil - now);
  }
  return wait;
}

/** Records a failure. Returns remaining attempts for this client before lock. */
export function recordFailure(account: string, clientId: string, now = Date.now()): number {
  let remaining = Infinity;
  for (const { key, rule } of keys(account, clientId)) {
    const b = getBucket(key, rule, now);
    b.failures += 1;
    if (b.failures >= rule.maxFailures) {
      b.lockedUntil = now + rule.lockMs;
      b.failures = 0;
      b.windowStart = now;
      remaining = 0;
    } else {
      remaining = Math.min(remaining, rule.maxFailures - b.failures);
    }
    saveBucket(key, b);
  }
  return remaining;
}

/** A success only clears the per-client bucket; the account-wide bucket keeps counting. */
export function recordSuccess(account: string, clientId: string): void {
  getDb().prepare("DELETE FROM login_buckets WHERE key = ?").run(clientKey(account, clientId));
}

export function __resetRateLimitsForTests(): void {
  getDb().exec("DELETE FROM login_buckets");
}
