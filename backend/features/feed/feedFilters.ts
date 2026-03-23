/**
 * Shared post-visibility and tag-matching helpers for feed pages and actions.
 * Pure filtering functions — no I/O, safe to call from any server context.
 *
 * Pages use filterVisiblePosts for the initial SSR load.
 * runFeedPageAction uses it for paginated loadMore calls via withVisibilityFilter.
 */
import { isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import type { PostWithAuthor, User } from "@/lib/domain/types";

// ---------------------------------------------------------------------------
// Tag constants
// ---------------------------------------------------------------------------

export const MISSION_TAGS = ["mission", "선교"] as const;
export const COUNSEL_TAGS = ["고민상담", "신학", "질문", "상담"] as const;

// ---------------------------------------------------------------------------
// Tag helpers
// ---------------------------------------------------------------------------

/**
 * Case-insensitive: does the post have at least one tag in `candidates`?
 */
export function hasAnyTag(
  postTags: string[] | null | undefined,
  candidates: readonly string[]
): boolean {
  if (!Array.isArray(postTags) || postTags.length === 0) return false;
  const lower = postTags.map((t) => t.toLowerCase());
  return candidates.some((c) => lower.includes(c.toLowerCase()));
}

/**
 * Case-insensitive: does the post have at least one counsel-category tag?
 */
export function hasCounselTag(tags: string[] | null | undefined): boolean {
  return hasAnyTag(tags, COUNSEL_TAGS);
}

// ---------------------------------------------------------------------------
// Visibility filter
// ---------------------------------------------------------------------------

/**
 * Remove posts the viewer is blocked from seeing, has muted the author of,
 * or cannot view per canViewPost rules.
 *
 * If currentUser is null/undefined the items are returned unchanged
 * (unauthenticated visitors see what the DB already filtered by visibility).
 */
export function filterVisiblePosts(
  items: PostWithAuthor[],
  currentUser: User | null | undefined
): PostWithAuthor[] {
  if (!currentUser) return items;
  return items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId)) return false;
    if (isMuted(currentUser.id, post.authorId)) return false;
    return canViewPost(post, currentUser, () => false);
  });
}
