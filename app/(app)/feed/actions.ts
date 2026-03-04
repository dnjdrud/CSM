"use server";

import { revalidatePath } from "next/cache";
import { getSession, getCurrentUser, getAuthUserId } from "@/backend/connection";
import { canViewPost, assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/backend/permissions";
import { createPost, toggleReaction } from "@/backend/features/posts";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { listFollowingIds, isBlocked, isMuted, toggleFollow } from "@/backend/features/profile";
import { addComment, listCommentsByPostId } from "@/backend/features/comments";
import type { ReactionType, PostWithAuthor } from "@/lib/domain/types";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { logInfo, logWarn, logError } from "@/lib/logging/systemLogger";

/** Toggle reaction (prayed / with you). Returns { ok, reacted } for optimistic UI. Revalidates feed and post. */
export async function toggleReactionAction(postId: string, type: ReactionType): Promise<{ ok: boolean; reacted?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    const { reacted } = await toggleReaction(postId, session.userId, type);
    revalidatePath("/feed");
    revalidatePath(`/post/${postId}`);
    return { ok: true, reacted };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Toggle follow (used on feed post card and post detail). Revalidates feed and profile. */
export async function toggleFollowAction(profileId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.userId === profileId) return false;
  await toggleFollow(session.userId, profileId);
  revalidatePath("/feed");
  revalidatePath(`/profile/${profileId}`);
  return true;
}

const DEFAULT_PAGE_LIMIT = 20;

/** Load next page of feed. Returns items + nextCursorStr. Applies same canViewPost filtering as feed page. */
export async function loadMoreFeedAction(input: {
  scope: "ALL" | "FOLLOWING";
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };
  const cursor = decodeCursor(input.cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    scope: input.scope,
    limit: DEFAULT_PAGE_LIMIT,
    cursor,
  });
  const followingIds = await listFollowingIds(session.userId);
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === session.userId && followingIds.includes(followingId);
  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], nextCursorStr: null };
  const items = result.items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId) || isMuted(currentUser.id, post.authorId)) return false;
    return canViewPost(post, currentUser, isFollowing);
  });
  const nextCursorStr = result.nextCursor ? encodeCursor(result.nextCursor) : null;
  return { items, nextCursorStr };
}

/** Fetch comments for a post (e.g. inline comment section on feed). */
export async function getCommentsForPostAction(postId: string) {
  return listCommentsByPostId(postId);
}

/** Compose post from feed (no redirect). Revalidates feed. */
export async function composePostAction(params: {
  content: string;
  category?: PostCategory;
  visibility?: Visibility;
  tags?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  logInfo("SERVER_ACTION", "composePostAction(feed) start", {
    hasContent: params.content.trim().length > 0,
    category: params.category ?? "PRAYER",
    visibility: params.visibility ?? "MEMBERS",
    hasTags: !!params.tags && params.tags.length > 0,
  });
  const session = await getSession();
  if (!session) {
    const authId = await getAuthUserId();
    logWarn("SERVER_ACTION", "composePostAction(feed) session null", {
      authUserId: authId ?? null,
    });
    return { ok: false, error: "Not logged in. Please refresh and try again." };
  }
  const trimmed = params.content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  try {
    await assertRateLimit({
      userId: session.userId,
      action: "CREATE_POST",
      maxPerMinute: 15,
      maxPer10Min: 50,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logWarn("SERVER_ACTION", "composePostAction(feed) rate limit or error", {
      userId: session.userId,
      rawMessage: msg,
    });
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Rate limit or server error" };
  }
  const tags = params.tags
    ? [...new Set(params.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 5)
    : [];
  try {
    await createPost({
      authorId: session.userId,
      category: params.category ?? "PRAYER",
      content: trimmed,
      visibility: params.visibility ?? "MEMBERS",
      tags,
    });
    logInfo("SERVER_ACTION", "composePostAction(feed) success", {
      userId: session.userId,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const display = (msg && msg.trim() !== "") ? msg : "Failed to create post (check server logs)";
    logError("SERVER_ACTION", "composePostAction(feed) createPost error", {
      userId: session.userId,
      error: display,
    });
    return { ok: false, error: display };
  }
}

/** Add comment (used on feed inline comments and post detail). */
export async function addCommentAction(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  console.log("[addCommentAction] session", session);
  if (!session) {
    const authUserId = await getAuthUserId();
    console.warn("[addCommentAction] session null. getAuthUserId:", authUserId ?? "null", "(if auth exists but session null, check users row / RLS)");
    return { ok: false, error: "Not logged in" };
  }
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comment is required" };
  try {
    await assertRateLimit({ userId: session.userId, action: "CREATE_COMMENT" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Failed to add comment" };
  }
  try {
    const payload = {
      postId,
      authorId: session.userId,
      content: trimmed,
      parentId: parentId || undefined,
    };
    console.log("[addCommentAction] insert payload", payload);
    await addComment(payload);
    revalidatePath(`/post/${postId}`);
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    console.error(
      "[addCommentAction] supabase error",
      e instanceof Error ? e.message : e
    );
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: (msg && msg.trim() !== "") ? msg : "Failed to add comment (check server logs)" };
  }
}

export async function deleteCommentAction(commentId: string, postId?: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const { deleteComment } = await import("@/lib/data/repository");
  const ok = await deleteComment(commentId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function updateCommentAction(commentId: string, content: string, postId?: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  const { updateComment } = await import("@/lib/data/repository");
  const updated = await updateComment(commentId, session.userId, trimmed);
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

/** Delete post (author only). Used on feed PostCard. */
export async function deletePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const { deletePost } = await import("@/lib/data/repository");
  const ok = await deletePost(postId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  const { redirect } = await import("next/navigation");
  redirect("/feed");
  return { ok: true };
}

/** Update post (author only). Used on feed PostCard. */
export async function updatePostAction(
  postId: string,
  content: string,
  category?: string,
  visibility?: string,
  tags?: string[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  const { updatePost } = await import("@/lib/data/repository");
  const updated = await updatePost(postId, session.userId, {
    content: trimmed,
    category: category as "PRAYER" | "DEVOTIONAL" | "MINISTRY" | undefined,
    visibility: visibility as "PUBLIC" | "MEMBERS" | "FOLLOWERS" | "PRIVATE" | undefined,
    tags,
  });
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}
