"use server";

import { getSession } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import type { PostWithAuthor } from "@/lib/domain/types";

const PAGE_LIMIT = 20;

/** Fetch a page of content posts (CONTENT + PHOTO categories, ALL scope). */
export async function loadMoreContentFeedAction(input: {
  cursorStr: string | null;
}): Promise<{ items: PostWithAuthor[]; nextCursorStr: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };

  const cursor = decodeCursor(input.cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    scope: "ALL",
    limit: PAGE_LIMIT,
    cursor,
    requireYoutubeUrl: true,
  });

  return {
    items: result.items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}
