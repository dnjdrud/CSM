"use server";

import { getSession } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { HOME_FEED_CATEGORIES, type PostWithAuthor } from "@/lib/domain/types";

const PAGE_LIMIT = 20;

async function loadFeedPage(
  userId: string,
  categories: string[],
  scope: "ALL" | "FOLLOWING",
  cursorStr: string | null
): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const cursor = decodeCursor(cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: userId,
    scope,
    limit: PAGE_LIMIT,
    cursor,
    includeCategories: categories,
  });
  return {
    items: result.items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}

/** Load next page of the home Feed tab (FOLLOWING scope). */
export async function loadMoreHomeFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };
  return loadFeedPage(session.userId, HOME_FEED_CATEGORIES, "FOLLOWING", input.cursorStr);
}
