"use server";

import { revalidatePath } from "next/cache";
import { getSession, getAuthUserId } from "@/backend/connection";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/backend/permissions";
import { createPost } from "@/backend/features/posts";
import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import { toggleFollow } from "@/backend/features/profile";
import * as postMutations from "@/app/(app)/_actions/postMutations";
import type { PostWithAuthor, PostCategory, Visibility, ReactionType, User } from "@/lib/domain/types";
import { logInfo, logWarn, logError } from "@/lib/logging/systemLogger";

export async function toggleReactionAction(postId: string, type: ReactionType) { return postMutations.toggleReactionAction(postId, type); }
export async function toggleBookmarkAction(postId: string) { return postMutations.toggleBookmarkAction(postId); }
export async function getReactorsAction(postId: string, type: ReactionType): Promise<User[]> { return postMutations.getReactorsAction(postId, type); }
export async function getCommentsForPostAction(postId: string) { return postMutations.getCommentsForPostAction(postId); }
export async function addCommentAction(postId: string, content: string, parentId?: string) { return postMutations.addCommentAction(postId, content, parentId); }
export async function deleteCommentAction(commentId: string, postId?: string) { return postMutations.deleteCommentAction(commentId, postId); }
export async function updateCommentAction(commentId: string, content: string, postId?: string) { return postMutations.updateCommentAction(commentId, content, postId); }
export async function updatePostAction(postId: string, content: string, category?: string, visibility?: string, tags?: string[]) { return postMutations.updatePostAction(postId, content, category, visibility, tags); }
export async function deletePostAction(postId: string) { return postMutations.deletePostAction(postId); }

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

/** Load next page of feed. Visibility filtering is handled at the DB layer. */
export async function loadMoreFeedAction(input: {
  scope: "ALL" | "FOLLOWING";
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: { scope: input.scope, limit: 20 },
  });
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
    category: params.category ?? "GENERAL",
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
      category: params.category ?? "GENERAL",
      content: trimmed,
      visibility: params.visibility ?? "PUBLIC",
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

