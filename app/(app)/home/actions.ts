"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import { HOME_FEED_CATEGORIES, type PostWithAuthor } from "@/lib/domain/types";

/** Load next page of the home Feed tab (FOLLOWING scope). */
export async function loadMoreHomeFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: { scope: "FOLLOWING", limit: 20, includeCategories: HOME_FEED_CATEGORIES },
  });
}
