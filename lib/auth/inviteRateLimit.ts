/**
 * In-memory rate limit for invite code validation attempts.
 * Key: auth user id. Limit: 5 attempts per 5 minutes.
 * Used by onboarding gate (and optionally form submit).
 */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const store = new Map<
  string,
  { count: number; resetAt: number }
>();

function now(): number {
  return Date.now();
}

/**
 * Returns true if the user is rate limited (should not attempt validation).
 */
export function isRateLimited(userId: string): boolean {
  const entry = store.get(userId);
  if (!entry) return false;
  if (entry.resetAt <= now()) {
    store.delete(userId);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

/**
 * Record an attempt. Call after each validation attempt (success or failure).
 */
export function recordAttempt(userId: string): void {
  const entry = store.get(userId);
  const n = now();
  if (!entry || entry.resetAt <= n) {
    store.set(userId, { count: 1, resetAt: n + WINDOW_MS });
    return;
  }
  entry.count += 1;
}
