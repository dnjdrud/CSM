"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/backend/connection";
import { deletePost } from "@/backend/features/posts";
import { revalidatePostPaths } from "@/lib/utils/revalidation";

import * as postMutations from "@/app/(app)/_actions/postMutations";
import type { ReactionType, User } from "@/lib/domain/types";

export async function toggleBookmarkAction(postId: string) { return postMutations.toggleBookmarkAction(postId); }
export async function toggleReactionAction(postId: string, type: ReactionType) { return postMutations.toggleReactionAction(postId, type); }
export async function getReactorsAction(postId: string, type: ReactionType): Promise<User[]> { return postMutations.getReactorsAction(postId, type); }
export async function getCommentsForPostAction(postId: string) { return postMutations.getCommentsForPostAction(postId); }
export async function addCommentAction(postId: string, content: string, parentId?: string) { return postMutations.addCommentAction(postId, content, parentId); }
export async function deleteCommentAction(commentId: string, postId?: string) { return postMutations.deleteCommentAction(commentId, postId); }
export async function updateCommentAction(commentId: string, content: string, postId?: string) { return postMutations.updateCommentAction(commentId, content, postId); }
export async function updatePostAction(postId: string, content: string, category?: string, visibility?: string, tags?: string[]) { return postMutations.updatePostAction(postId, content, category, visibility, tags); }

/**
 * Bookmarks-specific: delete post without redirecting.
 * The shared deletePostAction redirects to /feed, which is wrong on the bookmarks page.
 */
export async function deletePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const ok = await deletePost(postId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePostPaths(postId);
  revalidatePath("/bookmarks");
  return { ok: true };
}
