/**
 * Lightweight recommendation scorer.
 * Pure function — no DB calls. Apply after fetching candidates + signals.
 */

import type { PostWithAuthor, UserInteraction, UserInterestTag } from "@/lib/domain/types";

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
 * Build UserSignals from raw data in a single pass over interactions.
 * Uses a pre-built postId→authorId Map so author lookups are O(1),
 * not O(posts) per interaction row.
 */
export function buildUserSignals(
  posts: PostWithAuthor[],
  interactions: UserInteraction[],
  interestTags: UserInterestTag[],
  subscribedCreatorIds: string[]
): UserSignals {
  // O(posts) — built once, reused for all interaction lookups
  const postAuthorMap = new Map<string, string>(posts.map((p) => [p.id, p.authorId]));

  const likedPostIds = new Set<string>();
  const bookmarkedAuthorIds = new Set<string>();
  const watchedAuthorIds = new Set<string>();

  // O(interactions) single pass — no nested find()
  for (const i of interactions) {
    if (i.interactionType === "like") {
      likedPostIds.add(i.postId);
    } else if (i.interactionType === "bookmark") {
      const authorId = postAuthorMap.get(i.postId);
      if (authorId) bookmarkedAuthorIds.add(authorId);
    } else if (i.interactionType === "view" && (i.watchTimeSeconds ?? 0) > 60) {
      const authorId = postAuthorMap.get(i.postId);
      if (authorId) watchedAuthorIds.add(authorId);
    }
  }

  return {
    interestTags: new Map(interestTags.map((t) => [t.tag, t.weight])),
    likedPostIds,
    bookmarkedAuthorIds,
    watchedAuthorIds,
    subscribedCreatorIds: new Set(subscribedCreatorIds),
  };
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
