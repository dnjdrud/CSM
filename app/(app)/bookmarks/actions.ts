"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/backend/connection";
import { toggleBookmark } from "@/backend/features/bookmarks";
import { toggleReaction } from "@/backend/features/posts";
import { addComment, listCommentsByPostId } from "@/backend/features/comments";
import { deletePost, updatePost } from "@/backend/features/posts";
import type { ReactionType } from "@/lib/domain/types";
import { recordUserInteraction } from "@/lib/data/supabaseRepository";

export async function toggleBookmarkAction(postId: string): Promise<{ ok: boolean; bookmarked: boolean }> {
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

export async function toggleReactionAction(postId: string, type: ReactionType): Promise<{ ok: boolean; reacted?: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  try {
    const { reacted } = await toggleReaction(postId, session.userId, type);
    revalidatePath("/bookmarks");
    if (reacted) recordUserInteraction(session.userId, postId, "like").catch(() => {});
    return { ok: true, reacted };
  } catch {
    return { ok: false };
  }
}

export async function getCommentsForPostAction(postId: string) {
  return listCommentsByPostId(postId);
}

export async function addCommentAction(postId: string, content: string, parentId?: string) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await addComment({ postId, authorId: session.userId, content, parentId });
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deletePostAction(postId: string) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await deletePost(postId, session.userId);
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updatePostAction(postId: string, content: string, category?: string, visibility?: string, tags?: string[]) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await updatePost(postId, session.userId, { content, category: category as any, visibility: visibility as any, tags });
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
