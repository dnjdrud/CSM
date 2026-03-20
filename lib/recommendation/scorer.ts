/**
 * Lightweight recommendation scorer.
 * Pure function — no DB calls. Apply after fetching candidates + signals.
 */

import type { PostWithAuthor } from "@/lib/domain/types";

export interface UserSignals {
  /** Tag → weight from user_interest_tags */
  interestTags: Map<string, number>;
  /** Post IDs the user liked */
  likedPostIds: Set<string>;
  /** Author IDs the user bookmarked from */
  bookmarkedAuthorIds: Set<string>;
  /** Author IDs the user has significant watch time on (>60s) */
  watchedAuthorIds: Set<string>;
  /** Author IDs the user subscribes to */
  subscribedCreatorIds: Set<string>;
}

const NOW_MS = Date.now();

/** Score a single post given user signals. Higher = more relevant. */
function scorePost(post: PostWithAuthor, signals: UserSignals): number {
  let score = 0;

  // 1. Subscribed creator (strongest signal)
  if (signals.subscribedCreatorIds.has(post.authorId)) score += 10;

  // 2. Tag match weighted by user interest
  for (const tag of post.tags ?? []) {
    const weight = signals.interestTags.get(tag);
    if (weight) score += weight * 3;
  }

  // 3. Liked content from same author
  if (signals.bookmarkedAuthorIds.has(post.authorId)) score += 3;

  // 4. Watch time signal on this author
  if (signals.watchedAuthorIds.has(post.authorId)) score += 2;

  // 5. Recency decay — max 2pts, halving every 7 days
  const ageMs = NOW_MS - new Date(post.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  score += 2 * Math.pow(0.5, ageDays / 7);

  return score;
}

/**
 * Sort posts by recommendation score descending.
 * Falls back to recency if all scores are 0 (cold start).
 */
export function rankPosts(
  posts: PostWithAuthor[],
  signals: UserSignals
): PostWithAuthor[] {
  const scored = posts.map((p) => ({ post: p, score: scorePost(p, signals) }));
  scored.sort((a, b) => b.score - a.score || new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime());
  return scored.map((s) => s.post);
}
