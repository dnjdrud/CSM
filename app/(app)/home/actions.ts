"use server";

import { getSession } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { listFollowingIds, isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import { toggleReaction } from "@/backend/features/posts";
import { revalidatePath } from "next/cache";
import { HOME_FEED_CATEGORIES, type PostWithAuthor, type User } from "@/lib/domain/types";

const PAGE_LIMIT = 20;

/**
 * Shared helper: fetch one page of feed + following list in parallel, then filter.
 *
 * canViewPost only needs currentUser.id — no DB round-trip needed; session.userId suffices.
 *
 * NOTE: listFeedPostsPage(scope:"FOLLOWING") already fetches follows internally.
 * listFollowingIds here is a second fetch used only for the isFollowing predicate in
 * canViewPost. Running them in parallel eliminates sequential latency. Future improvement:
 * expose the follows result from listFeedPostsPage so this extra query can be removed.
 */
async function loadFeedPage(
  userId: string,
  categories: string[],
  cursorStr: string | null
): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const cursor = decodeCursor(cursorStr);

  // Both fetches start immediately — neither depends on the other.
  const [result, followingIds] = await Promise.all([
    listFeedPostsPage({
      currentUserId: userId,
      scope: "FOLLOWING",
      limit: PAGE_LIMIT,
      cursor,
      includeCategories: categories,
    }),
    listFollowingIds(userId),
  ]);

  // Construct minimal User — canViewPost only inspects .id, avoiding a DB call.
  const currentUser = { id: userId } as User;
  const followingSet = new Set(followingIds);
  const isFollowing = (f: string, fi: string) => f === userId && followingSet.has(fi);

  const items = result.items.filter((post) => {
    if (isBlocked(userId, post.authorId)) return false;
    if (isMuted(userId, post.authorId)) return false;
    return canViewPost(post, currentUser, isFollowing);
  });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}

/* ──────────────────────────────────── Feed Tab ── */

/** Load next page of the home Feed tab (FOLLOWING scope, no PRAYER posts). */
export async function loadMoreHomeFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };
  return loadFeedPage(session.userId, HOME_FEED_CATEGORIES, input.cursorStr);
}

/* ──────────────────────────────────── Prayer Tab ── */

/** Load next page of the home Prayer tab (FOLLOWING scope, PRAYER posts only). */
export async function loadMorePrayerFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };
  return loadFeedPage(session.userId, ["PRAYER"], input.cursorStr);
}

/* ──────────────────────────────────── Reactions ── */

/**
 * Toggle PRAYED reaction on a prayer post.
 * Revalidates /home so server-rendered prayer counts stay in sync on next full load.
 */
export async function togglePrayerAction(
  postId: string
): Promise<{ ok: boolean; prayed?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "로그인이 필요합니다" };
  try {
    const { reacted } = await toggleReaction(postId, session.userId, "PRAYED");
    revalidatePath("/home");
    revalidatePath(`/post/${postId}`);
    return { ok: true, prayed: reacted };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "문제가 발생했습니다" };
  }
}
