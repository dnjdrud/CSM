/**
 * Shared revalidation helpers for post mutations.
 * Import these in Server Actions to keep cache invalidation consistent.
 */
import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths affected by a post mutation (reaction, comment, edit, delete).
 * - /post/:id  — post detail page
 * - /feed      — legacy feed redirect (still cached)
 * - /home      — main home feed
 * - /bookmarks — bookmarked posts show reactions/comments inline
 */
export function revalidatePostPaths(postId: string): void {
  revalidatePath(`/post/${postId}`);
  revalidatePath("/feed");
  revalidatePath("/home");
  revalidatePath("/bookmarks");
}
