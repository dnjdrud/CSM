/**
 * Shared helper for cursor-paginated feed server actions.
 *
 * NOT a server action itself — import from "use server" action files only.
 * Centralizes: session guard, cursor decode/encode, listFeedPostsPage call,
 * optional isBlocked/isMuted/canViewPost check, optional extra post filter.
 */
import { getSession, getCurrentUser } from "@/backend/connection";
import { listFeedPostsPage } from "@/lib/data/repository";
import { decodeCursor, encodeCursor } from "@/lib/domain/pagination";
import { isBlocked, isMuted } from "@/backend/features/profile";
import { canViewPost } from "@/backend/permissions";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { ListFeedPostsPageParams } from "@/lib/data/repository";

export type FeedPageResult = {
  items: PostWithAuthor[];
  nextCursorStr: string | null;
};

export interface FeedPageOptions {
  /**
   * listFeedPostsPage params, minus `currentUserId` and `cursor`
   * (both are injected automatically from session + decoded cursorStr).
   */
  pageParams: Omit<ListFeedPostsPageParams, "currentUserId" | "cursor">;
  /**
   * When true: fetches `currentUser` and removes posts where the viewer is
   * blocked by or has muted the author, and where `canViewPost` returns false.
   * Omit (or false) for feeds that serve all authenticated users without
   * per-author visibility checks (saves one `getCurrentUser()` round-trip).
   */
  withVisibilityFilter?: boolean;
  /**
   * Optional extra filter applied after the visibility check.
   * Receives one post; return false to exclude it.
   * Safe to reference variables from the calling action's closure.
   */
  postFilter?: (post: PostWithAuthor) => boolean;
}

/**
 * Run a cursor-paginated feed query and return the standard
 * `{ items, nextCursorStr }` shape consumed by `useInfiniteScroll`.
 */
export async function runFeedPageAction(
  cursorStr: string | null,
  options: FeedPageOptions
): Promise<FeedPageResult> {
  const session = await getSession();
  if (!session) return { items: [], nextCursorStr: null };

  const cursor = decodeCursor(cursorStr);
  const result = await listFeedPostsPage({
    currentUserId: session.userId,
    cursor,
    ...options.pageParams,
  });

  let items = result.items;

  if (options.withVisibilityFilter) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { items: [], nextCursorStr: null };

    items = items.filter((post) => {
      if (isBlocked(currentUser.id, post.authorId)) return false;
      if (isMuted(currentUser.id, post.authorId)) return false;
      return canViewPost(post, currentUser, () => false);
    });
  }

  if (options.postFilter) {
    items = items.filter(options.postFilter);
  }

  return {
    items,
    nextCursorStr: result.nextCursor ? encodeCursor(result.nextCursor) : null,
  };
}
