"use client";

/**
 * Reusable infinite-scroll hook.
 *
 * Manages: items state, cursor, loading/error, IntersectionObserver lifecycle,
 * and server-side sync (reset when initialItems head changes after revalidation).
 *
 * Usage:
 *   const { items, loading, error, hasMore, sentinelRef } = useInfiniteScroll({
 *     initialItems,
 *     initialNextCursorStr,
 *     loadMore: (cursor) => loadMoreXxxAction({ cursorStr: cursor }),
 *   });
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type InfiniteScrollLoadFn<T> = (
  cursorStr: string
) => Promise<{ items: T[]; nextCursorStr: string | null }>;

export interface UseInfiniteScrollOptions<T> {
  initialItems: T[];
  initialNextCursorStr: string | null;
  /** Async function that fetches the next page given the current cursor. */
  loadMore: InfiniteScrollLoadFn<T>;
}

export interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  /** True while nextCursor is non-null — use to show "end of list" UI. */
  hasMore: boolean;
  /** Attach to a 1px sentinel div placed after the list. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function useInfiniteScroll<T extends { id: string }>({
  initialItems,
  initialNextCursorStr,
  loadMore,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [nextCursorStr, setNextCursorStr] = useState<string | null>(
    initialNextCursorStr
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep a ref so fetchMore always calls the latest loadMore without
  // needing it in the useCallback dep array (avoids stale-closure churn).
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  // Sync when the server re-renders with fresh data (e.g. after post creation
  // or filter change). Compare only the head ID — intentional shallow check.
  useEffect(() => {
    if (initialItems[0]?.id !== items[0]?.id) {
      setItems(initialItems);
      setNextCursorStr(initialNextCursorStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, initialNextCursorStr]);

  const fetchMore = useCallback(async () => {
    if (!nextCursorStr || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadMoreRef.current(nextCursorStr);
      setItems((prev) => [...prev, ...result.items]);
      setNextCursorStr(result.nextCursorStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "더 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [nextCursorStr, loading]);

  // IntersectionObserver: trigger 300 px before the sentinel enters viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && nextCursorStr && !loading) fetchMore();
      },
      { rootMargin: "300px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore, nextCursorStr, loading]);

  return {
    items,
    loading,
    error,
    hasMore: nextCursorStr !== null,
    sentinelRef,
  };
}
