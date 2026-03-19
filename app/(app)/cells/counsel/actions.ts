"use server";

import { getSession, getCurrentUser } from "@/backend/connection";
import { listFeedPostsPage, decodeCursor, encodeCursor } from "@/backend/features/feed";
import { isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import type { PostWithAuthor } from "@/lib/domain/types";

const PAGE_LIMIT = 40;
const COUNSEL_TAGS = ["고민상담", "신학", "질문", "상담"];

function hasCounselTag(tags: string[]): boolean {
  return COUNSEL_TAGS.some((ct) =>
    tags.some((t) => t.toLowerCase() === ct.toLowerCase())
  );
}

export async function loadMoreCounselAction(input: {
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
    includeCategories: ["CELL", "GENERAL", "DEVOTIONAL"],
  });

  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], nextCursorStr: null };

  const items = result.items.filter((post) => {
    if (isBlocked(currentUser.id, post.authorId)) return false;
    if (isMuted(currentUser.id, post.authorId)) return false;
    if (!canViewPost(post, currentUser, () => false)) return false;
    return hasCounselTag(post.tags ?? []);
  });

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}
