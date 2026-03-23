"use server";

/**
 * Shared post/comment mutation server actions.
 * Consumed by feed, bookmarks, and post-detail route action files via re-export.
 * Route-specific wrappers (deletePostAction without redirect in bookmarks,
 * addCommentAction with mention notifications in post detail) live in their
 * respective actions.ts files.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/connection";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/backend/permissions";
import { toggleReaction, deletePost, updatePost } from "@/backend/features/posts";
import { toggleBookmark } from "@/backend/features/bookmarks";
import {
  addComment,
  listCommentsByPostId,
  deleteComment,
  updateComment,
} from "@/backend/features/comments";
import { getReactors } from "@/lib/data/repository";
import { recordUserInteraction } from "@/lib/data/supabaseRepository";
import { revalidatePostPaths } from "@/lib/utils/revalidation";
import type { ReactionType, PostCategory, Visibility, User } from "@/lib/domain/types";

export async function toggleReactionAction(
  postId: string,
  type: ReactionType
): Promise<{ ok: boolean; reacted?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    const { reacted } = await toggleReaction(postId, session.userId, type);
    revalidatePostPaths(postId);
    if (reacted) recordUserInteraction(session.userId, postId, "like").catch(() => {});
    return { ok: true, reacted };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function toggleBookmarkAction(
  postId: string
): Promise<{ ok: boolean; bookmarked: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false, bookmarked: false };
  try {
    const { bookmarked } = await toggleBookmark(session.userId, postId);
    revalidatePath("/bookmarks");
    if (bookmarked) recordUserInteraction(session.userId, postId, "bookmark").catch(() => {});
    return { ok: true, bookmarked };
  } catch {
    return { ok: false, bookmarked: false };
  }
}

export async function getReactorsAction(postId: string, type: ReactionType): Promise<User[]> {
  const session = await getSession();
  if (!session) return [];
  try {
    return await getReactors(postId, type);
  } catch {
    return [];
  }
}

export async function getCommentsForPostAction(postId: string) {
  return listCommentsByPostId(postId);
}

export async function addCommentAction(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comment is required" };
  try {
    await assertRateLimit({ userId: session.userId, action: "CREATE_COMMENT" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to add comment" };
  }
  try {
    await addComment({
      postId,
      authorId: session.userId,
      content: trimmed,
      parentId: parentId || undefined,
    });
    revalidatePostPaths(postId);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: (msg && msg.trim() !== "") ? msg : "Failed to add comment" };
  }
}

export async function deleteCommentAction(
  commentId: string,
  postId?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const ok = await deleteComment(commentId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath("/home");
  revalidatePath("/bookmarks");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function updateCommentAction(
  commentId: string,
  content: string,
  postId?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  const updated = await updateComment(commentId, session.userId, trimmed);
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath("/home");
  revalidatePath("/bookmarks");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

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
  const updated = await updatePost(postId, session.userId, {
    content: trimmed,
    category: category as PostCategory | undefined,
    visibility: visibility as Visibility | undefined,
    tags,
  });
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePostPaths(postId);
  return { ok: true };
}

/**
 * Delete post and redirect to /feed.
 * Bookmarks keeps its own wrapper that omits the redirect.
 */
export async function deletePostAction(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const ok = await deletePost(postId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePostPaths(postId);
  redirect("/feed");
}
