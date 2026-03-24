/**
 * Shared revalidation helpers for post mutations.
 * Import these in Server Actions to keep cache invalidation consistent.
 */
import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths affected by a post mutation (reaction, comment, edit, delete).
 * - /post/:id  — post detail page (skipped when postId is undefined, e.g. comment delete without postId)
 * - /feed      — legacy feed redirect (still cached)
 * - /home      — main home feed
 * - /bookmarks — bookmarked posts show reactions/comments inline
 */
export function revalidatePostPaths(postId?: string): void {
  if (postId) revalidatePath(`/post/${postId}`);
  revalidatePath("/feed");
  revalidatePath("/home");
  revalidatePath("/bookmarks");
}

/**
 * Revalidate all feed surfaces after creating a new post.
 * - /feed    — legacy feed redirect
 * - /home    — main home feed
 * - /shorts  — shorts vertical feed
 * - /contents — youtube/content feed
 */
export function revalidateNewPostPaths(): void {
  revalidatePath("/feed");
  revalidatePath("/home");
  revalidatePath("/shorts");
  revalidatePath("/contents");
}
