"use server";

import { runFeedPageAction } from "@/backend/features/feed/feedPage";
import type { PostWithAuthor } from "@/lib/domain/types";

/** Fetch a page of collaboration request posts (REQUEST category, ALL scope). */
export async function loadMoreCollabRequestsAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  return runFeedPageAction(input.cursorStr, {
    pageParams: { scope: "ALL", limit: 20, includeCategories: ["REQUEST"] },
    withVisibilityFilter: true,
  });
}
