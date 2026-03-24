import type { User, ReactionType } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthorMap } from "./_internal/postHelpers";

export async function toggleReaction(
  postId: string,
  userId: string,
  type: ReactionType
): Promise<{ reacted: boolean }> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    return { reacted: false };
  }
  await supabase.from("reactions").insert({ post_id: postId, user_id: userId, type });
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (post && post.author_id !== userId) {
    const { notifyReacted } = await import("@/lib/notifications/events");
    await notifyReacted({ recipientId: post.author_id, actorId: userId, postId });
  }
  return { reacted: true };
}

export async function getReactors(postId: string, type: ReactionType): Promise<User[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("reactions")
    .select("user_id")
    .eq("post_id", postId)
    .eq("type", type)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];
  const ids = rows.map((r) => r.user_id);
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}
