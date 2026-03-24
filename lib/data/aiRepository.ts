import type {
  UserInteraction,
  UserInteractionType,
  UserInterestTag,
} from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";

/** Record a user interaction event (view, like, bookmark, subscribe). */
export async function recordUserInteraction(
  userId: string,
  postId: string,
  interactionType: UserInteractionType,
  watchTimeSeconds?: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("user_interactions").insert({
    user_id: userId,
    post_id: postId,
    interaction_type: interactionType,
    watch_time_seconds: watchTimeSeconds ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Fetch recent interaction history for a user (for recommendation input). */
export async function getUserInteractions(
  userId: string,
  limit = 100
): Promise<UserInteraction[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("user_interactions")
    .select("id, user_id, post_id, interaction_type, watch_time_seconds, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    postId: r.post_id,
    interactionType: r.interaction_type as UserInteractionType,
    watchTimeSeconds: r.watch_time_seconds ?? undefined,
    createdAt: r.created_at,
  }));
}

/** Fetch a user's interest tag weights, descending by weight. */
export async function getUserInterestTags(userId: string): Promise<UserInterestTag[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("user_interest_tags")
    .select("user_id, tag, weight, updated_at")
    .eq("user_id", userId)
    .order("weight", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    userId: r.user_id,
    tag: r.tag,
    weight: Number(r.weight),
    updatedAt: r.updated_at,
  }));
}

/**
 * Increment (or create) a tag's weight for a user.
 * delta > 0 increases interest; use negative delta to decay.
 */
export async function adjustUserInterestTag(
  userId: string,
  tag: string,
  delta: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("adjust_user_interest_tag", {
    p_user_id: userId,
    p_tag: tag,
    p_delta: delta,
  });
  if (error) {
    const { data: existing } = await supabase
      .from("user_interest_tags")
      .select("weight")
      .eq("user_id", userId)
      .eq("tag", tag)
      .single();
    const newWeight = Math.max(0, (existing ? Number(existing.weight) : 0) + delta);
    const { error: upsertError } = await supabase
      .from("user_interest_tags")
      .upsert({ user_id: userId, tag, weight: newWeight, updated_at: new Date().toISOString() });
    if (upsertError) return { ok: false, error: upsertError.message };
  }
  return { ok: true };
}
