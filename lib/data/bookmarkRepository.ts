import type { PostWithAuthor } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { hydratePostRows, POSTS_FEED_SELECT } from "./_internal/postHelpers";
import type { FeedPostRow } from "./_internal/postHelpers";

export async function toggleBookmark(
  userId: string,
  postId: string
): Promise<{ bookmarked: boolean }> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await supabase.from("user_bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  }
  await supabase.from("user_bookmarks").insert({ user_id: userId, post_id: postId });
  return { bookmarked: true };
}

export async function listBookmarks(userId: string, limit = 50): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  const { data: bookmarkRows } = await supabase
    .from("user_bookmarks")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!bookmarkRows?.length) return [];
  const postIds = bookmarkRows.map((r) => r.post_id);
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .in("id", postIds);
  if (!rows?.length) return [];
  const hydrated = await hydratePostRows(supabase, rows as FeedPostRow[], userId, {
    includeCommentCounts: true,
  });
  const hydratedMap = new Map(hydrated.map((p) => [p.id, p]));
  return bookmarkRows
    .map((b) => hydratedMap.get(b.post_id))
    .filter((p): p is PostWithAuthor => p != null);
}

export async function getBookmarkedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (!postIds.length) return [];
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("user_bookmarks")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  return (data ?? []).map((r) => r.post_id);
}
