/**
 * Lightweight rate limiting for write actions. Supabase mode only; memory mode bypasses.
 * Uses supabaseAdmin (service role) so rate_limits SELECT/INSERT bypass RLS; must only be called from server.
 */
import { DATA_MODE } from "@/lib/data/repositoryMode";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

/** User-facing message when rate limit is hit. */
export const RATE_LIMIT_MESSAGE = "You're posting too quickly. Please slow down.";

export type RateLimitAction =
  | "CREATE_POST"
  | "CREATE_COMMENT"
  | "REPORT"
  | "CREATE_INVITE"
  | "SEND_DM";

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
 * In memory mode, does nothing (no throw, no insert).
 */
export async function assertRateLimit(params: AssertRateLimitParams): Promise<void> {
  if (DATA_MODE !== "supabase") return;

  const { userId, action, maxPerMinute = DEFAULT_MAX_PER_MINUTE, maxPer10Min = DEFAULT_MAX_PER_10_MIN } = params;
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const { data: rows, error: selectError } = await supabaseAdmin
    .from("rate_limits")
    .select("created_at")
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", tenMinAgo);

  if (selectError) {
    console.error("Rate limit check failed", selectError);
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

  const { error: insertError } = await supabaseAdmin.from("rate_limits").insert({
    user_id: userId,
    action,
  });

  if (insertError) throw new Error("Rate limit record failed");
}
