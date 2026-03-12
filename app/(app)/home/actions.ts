"use server";

import { getSession, getCurrentUser } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { listFollowingIds, isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import { toggleReaction } from "@/backend/features/posts";
import { revalidatePath } from "next/cache";
import { HOME_FEED_CATEGORIES, type PostWithAuthor } from "@/lib/domain/types";

const PAGE_LIMIT = 20;

/* ──────────────────────────────────── Feed Tab ── */

/** Load next page of the home Feed tab (FOLLOWING scope, no PRAYER posts). */
export async function loadMoreHomeFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };

  const cursor = decodeCursor(input.cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    scope: "FOLLOWING",
    limit: PAGE_LIMIT,
    cursor,
    includeCategories: HOME_FEED_CATEGORIES,
  });

  const [followingIds, currentUser] = await Promise.all([
    listFollowingIds(session.userId),
    getCurrentUser(),
  ]);
  if (!currentUser) return { items: [], nextCursorStr: null };

  const isFollowing = (f: string, fi: string) =>
    f === session.userId && followingIds.includes(fi);

  const items = result.items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId)) return false;
    if (isMuted(currentUser.id, post.authorId)) return false;
    return canViewPost(post, currentUser, isFollowing);
  });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}

/* ──────────────────────────────────── Prayer Tab ── */

/** Load next page of the home Prayer tab (FOLLOWING scope, PRAYER posts only). */
export async function loadMorePrayerFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };

  const cursor = decodeCursor(input.cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    scope: "FOLLOWING",
    limit: PAGE_LIMIT,
    cursor,
    includeCategories: ["PRAYER"],
  });

  const [followingIds, currentUser] = await Promise.all([
    listFollowingIds(session.userId),
    getCurrentUser(),
  ]);
  if (!currentUser) return { items: [], nextCursorStr: null };

  const isFollowing = (f: string, fi: string) =>
    f === session.userId && followingIds.includes(fi);

  const items = result.items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId)) return false;
    if (isMuted(currentUser.id, post.authorId)) return false;
    return canViewPost(post, currentUser, isFollowing);
  });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}

/**
 * Toggle PRAYED reaction on a prayer post.
 * Reuses the existing reactions table (type = "PRAYED").
 * Returns { ok, prayed } for optimistic UI.
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
