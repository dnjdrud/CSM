import type { User } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthorMap } from "./_internal/postHelpers";

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const client = getSupabaseAdmin() ?? (await supabaseServer());
  const { data } = await client.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map((r) => r.following_id);
}

export async function listFollowingWithNames(userId: string): Promise<{ id: string; name: string }[]> {
  const client = getSupabaseAdmin() ?? (await supabaseServer());
  const { data } = await client
    .from("follows")
    .select("users!follows_following_id_fkey(id, name)")
    .eq("follower_id", userId);
  return (data ?? [])
    .map((r: any) => r.users)
    .filter(Boolean) as { id: string; name: string }[];
}

export async function listFollowerIds(userId: string): Promise<string[]> {
  const client = getSupabaseAdmin() ?? (await supabaseServer());
  const { data } = await client.from("follows").select("follower_id").eq("following_id", userId);
  return (data ?? []).map((r) => r.follower_id);
}

/**
 * Returns follower and following counts for a user using COUNT queries (HEAD).
 * Much cheaper than listFollowerIds + listFollowingIds when only counts are needed.
 */
export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const client = getSupabaseAdmin() ?? (await supabaseServer());
  const [followerRes, followingRes] = await Promise.all([
    client
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    client
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return {
    followers: followerRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}

export async function listFollowers(userId: string): Promise<User[]> {
  const admin = getSupabaseAdmin() ?? (await supabaseServer());
  const { data: followRows } = await admin
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);
  if (!followRows?.length) return [];
  const ids = followRows.map((r: { follower_id: string }) => r.follower_id);
  const supabase = await supabaseServer();
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}

export async function listFollowing(userId: string): Promise<User[]> {
  const admin = getSupabaseAdmin() ?? (await supabaseServer());
  const { data: followRows } = await admin
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (!followRows?.length) return [];
  const ids = followRows.map((r: { following_id: string }) => r.following_id);
  const supabase = await supabaseServer();
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    return false;
  }
  await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  const { notifyFollowed } = await import("@/lib/notifications/events");
  await notifyFollowed({ recipientId: followingId, actorId: followerId });
  return true;
}
