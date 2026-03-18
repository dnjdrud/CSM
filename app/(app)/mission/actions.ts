"use server";

import { getSession, getCurrentUser } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import { findCountryByCode } from "@/lib/mission/countries";
import type { PostWithAuthor } from "@/lib/domain/types";

const PAGE_LIMIT = 20;
const MISSION_TAGS = ["mission", "선교"];

function hasAnyTag(postTags: string[] | null | undefined, candidates: string[]): boolean {
  if (!Array.isArray(postTags) || postTags.length === 0) return false;
  const lower = postTags.map((t) => t.toLowerCase());
  return candidates.some((c) => lower.includes(c.toLowerCase()));
}

/** Mission hub feed: posts tagged with mission + optional country tag. */
export async function loadMoreMissionHubAction(input: {
  cursorStr: string | null;
  countryCode?: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };

  const cursor = decodeCursor(input.cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    scope: "ALL",
    limit: PAGE_LIMIT,
    cursor,
    includeCategories: ["MISSION", "CONTENT", "PHOTO"],
  });

  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], nextCursorStr: null };

  const country = input.countryCode ? findCountryByCode(input.countryCode) : undefined;
  const countryTags = country?.tags ?? null;

  const items = result.items
    .filter((post) => {
      if (isBlocked(currentUser.id, post.authorId)) return false;
      if (isMuted(currentUser.id, post.authorId)) return false;
      return canViewPost(post, currentUser, () => false);
    })
    .filter((post) => {
      const tags = post.tags ?? [];
      if (!hasAnyTag(tags, MISSION_TAGS) && post.category !== "MISSION") return false;
      if (countryTags && countryTags.length > 0) {
        return hasAnyTag(tags, countryTags);
      }
      return true;
    });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}

