/**
 * Visibility and access guards. Used by feed and post detail to filter/hide content.
 */
import type { Post, User } from "@/lib/domain/types";

export type IsFollowingFn = (followerId: string, followingId: string) => boolean;

/**
 * Whether the current user can view this post.
 * - PUBLIC / MEMBERS: any logged-in user (platform is closed)
 * - FOLLOWERS: author or followers of author
 * - PRIVATE: author only
 */
export function canViewPost(
  post: Post,
  currentUser: User | null,
  isFollowing: IsFollowingFn
): boolean {
  if (!currentUser) return false;
  const isAuthor = post.authorId === currentUser.id;
  if (post.visibility === "PRIVATE") return isAuthor;
  if (post.visibility === "FOLLOWERS") return isAuthor || isFollowing(currentUser.id, post.authorId);
  // PUBLIC, MEMBERS: any logged-in user
  return true;
}
