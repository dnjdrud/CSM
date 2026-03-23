"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/backend/connection";
import { deletePost } from "@/backend/features/posts";
import { revalidatePostPaths } from "@/lib/utils/revalidation";

export {
  toggleBookmarkAction,
  toggleReactionAction,
  getReactorsAction,
  getCommentsForPostAction,
  addCommentAction,
  deleteCommentAction,
  updateCommentAction,
  updatePostAction,
} from "@/app/(app)/_actions/postMutations";

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
