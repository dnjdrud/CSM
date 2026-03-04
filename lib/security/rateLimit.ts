/**
 * Lightweight rate limiting for write actions. Supabase mode only; memory mode bypasses.
 * Uses service role (admin) client for rate_limits so RLS does not block SELECT/INSERT.
 * If admin client is unavailable or check/insert fails, we allow the action (no block).
 */
import { DATA_MODE } from "@/lib/data/repositoryMode";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

/** User-facing message when rate limit is hit. */
export const RATE_LIMIT_MESSAGE = "You're posting too quickly. Please slow down.";

export type RateLimitAction =
  | "CREATE_POST"
  | "CREATE_COMMENT"
  | "REPORT"
  | "CREATE_INVITE"
  | "CREATE_DAILY_PRAYER";

export interface AssertRateLimitParams {
  userId: string;
  action: RateLimitAction;
  maxPerMinute?: number;
  maxPer10Min?: number;
}

const DEFAULT_MAX_PER_MINUTE = 5;
const DEFAULT_MAX_PER_10_MIN = 20;

/**
 * Check counts in last 1 and 10 minutes; if over limits, throw.
 * Otherwise insert a row for this action.
 * Uses supabaseAdmin (service role) so RLS does not block. On any failure, allow the action.
 */
export async function assertRateLimit(params: AssertRateLimitParams): Promise<void> {
  if (DATA_MODE !== "supabase") return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[rateLimit] admin client unavailable, allowing action", { action: params.action });
    }
    return;
  }

  const { userId, action, maxPerMinute = DEFAULT_MAX_PER_MINUTE, maxPer10Min = DEFAULT_MAX_PER_10_MIN } = params;
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const { data: rows, error: selectError } = await admin
    .from("rate_limits")
    .select("created_at")
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", tenMinAgo);

  if (selectError) {
    console.error("[rateLimit] Rate limit check failed", selectError);
    return;
  }

  const list = rows ?? [];
  const inLast10 = list.length;
  const inLast1 = list.filter((r: { created_at?: string }) => (r.created_at ?? "") >= oneMinAgo).length;

  if (inLast1 >= maxPerMinute || inLast10 >= maxPer10Min) {
    const err = new Error(RATE_LIMIT_EXCEEDED);
    err.name = RATE_LIMIT_EXCEEDED;
    throw err;
  }

  const { error: insertError } = await admin.from("rate_limits").insert({
    user_id: userId,
    action,
  });

  if (insertError) {
    console.error("[rateLimit] Rate limit record failed", insertError);
  }
}
