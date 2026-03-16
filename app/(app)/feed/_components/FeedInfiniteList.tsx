"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FeedPostCard } from "./FeedPostCard";
import { FeedPostSkeleton } from "./FeedPostSkeleton";
import { FeedSkeletonRow } from "./FeedSkeletonRow";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreFeedAction } from "../actions";

type Scope = "ALL" | "FOLLOWING";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  scope: Scope;
  currentUserId?: string | null;
  followingIds: string[];
  bookmarkedPostIds?: string[];
};

export function FeedInfiniteList({
  initialItems,
  initialNextCursorStr,
  scope,
  currentUserId,
  followingIds,
  bookmarkedPostIds = [],
}: Props) {
  const [items, setItems] = useState<PostWithAuthor[]>(initialItems);
  const [nextCursorStr, setNextCursorStr] = useState<string | null>(initialNextCursorStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const serverHeadId = initialItems[0]?.id;
    const currentHeadId = items[0]?.id;
    if (serverHeadId !== currentHeadId) {
      setItems(initialItems);
      setNextCursorStr(initialNextCursorStr);
    }
  }, [initialItems, initialNextCursorStr, items]);

  const loadMore = useCallback(async () => {
    if (!nextCursorStr || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadMoreFeedAction({ scope, cursorStr: nextCursorStr });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursorStr(result.nextCursorStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [nextCursorStr, loading, scope]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextCursorStr && !loading) loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextCursorStr, loading]);

  return (
    <>
      <ul className="list-none p-0 space-y-6 sm:space-y-5" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <FeedPostCard
              post={post}
              currentUserId={currentUserId ?? null}
              initialFollowing={followingIds.includes(post.authorId)}
              initialBookmarked={bookmarkedPostIds.includes(post.id)}
              compact
            />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />
      {loading && (
        <ul className="list-none p-0 border-t border-theme-border" role="list" aria-busy="true" aria-label="Loading more">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <FeedSkeletonRow />
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="py-4 px-4 text-center text-[13px] text-theme-warning" role="alert">
          {error}
        </p>
      )}
      {!loading && nextCursorStr === null && items.length > 0 && (
        <p className="py-6 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border">
          You&apos;re all caught up.
        </p>
      )}
    </>
  );
}
