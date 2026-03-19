"use server";

import { getSession, getCurrentUser } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
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

  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], nextCursorStr: null };

  const items = result.items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId)) return false;
    if (isMuted(currentUser.id, post.authorId)) return false;
    return canViewPost(post, currentUser, () => false);
  });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}
