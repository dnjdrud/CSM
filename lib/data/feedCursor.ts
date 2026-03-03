import type { FeedCursor } from "@/lib/domain/pagination";
import type { PostWithAuthor } from "@/lib/domain/types";

export { encodeCursor, decodeCursor } from "@/lib/domain/pagination";

/**
 * Compute next cursor from last item in a page. Used for stable pagination.
 */
export function getNextCursorFromItems(items: PostWithAuthor[]): FeedCursor | null {
  if (!items.length) return null;
  const last = items[items.length - 1];
  if (!last?.createdAt || !last?.id) return null;
  return { createdAt: last.createdAt, id: last.id };
}
