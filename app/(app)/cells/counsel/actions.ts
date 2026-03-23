"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import { hasCounselTag } from "@/backend/features/feed/feedFilters";
import type { PostWithAuthor } from "@/lib/domain/types";

export async function loadMoreCounselAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: {
      scope: "ALL",
      limit: 40,
      includeCategories: ["CELL", "GENERAL", "DEVOTIONAL"],
    },
    withVisibilityFilter: true,
    postFilter: (post) => hasCounselTag(post.tags ?? []),
  });
}
