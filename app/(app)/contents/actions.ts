"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import type { PostWithAuthor } from "@/lib/domain/types";

/** Fetch a page of content posts (CONTENT + PHOTO categories, ALL scope). */
export async function loadMoreContentFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: { scope: "ALL", limit: 20, requireYoutubeUrl: true },
  });
}
