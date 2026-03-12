"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FeedPostCard } from "@/app/(app)/feed/_components/FeedPostCard";
import { FeedSkeletonRow } from "@/app/(app)/feed/_components/FeedSkeletonRow";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreHomeFeedAction } from "../actions";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  currentUserId: string | null;
  followingIds: string[];
  bookmarkedPostIds?: string[];
};

export function HomeInfiniteList({
  initialItems,
  initialNextCursorStr,
  currentUserId,
  followingIds,
  bookmarkedPostIds = [],
}: Props) {
  const [items, setItems] = useState<PostWithAuthor[]>(initialItems);
  const [nextCursorStr, setNextCursorStr] = useState<string | null>(initialNextCursorStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync when server re-renders with fresh data (e.g. after post creation)
  useEffect(() => {
    const serverHeadId = initialItems[0]?.id;
    const localHeadId = items[0]?.id;
    if (serverHeadId !== localHeadId) {
      setItems(initialItems);
      setNextCursorStr(initialNextCursorStr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, initialNextCursorStr]);

  const loadMore = useCallback(async () => {
    if (!nextCursorStr || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadMoreHomeFeedAction({ cursorStr: nextCursorStr });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursorStr(result.nextCursorStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "더 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [nextCursorStr, loading]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && nextCursorStr && !loading) loadMore();
      },
      { rootMargin: "300px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextCursorStr, loading]);

  if (items.length === 0 && !loading) {
    return (
      <EmptyState
        title="피드가 비어있습니다"
        description="팔로우한 사람들의 글이 여기 표시됩니다. 아직 기도 제목을 제외한 나눔 글이 없습니다."
        action={{ label: "사람 찾기", href: "/explore" }}
      />
    );
  }

  return (
    <div>
      <ul className="list-none p-0 divide-y divide-theme-border/40" role="list">
        {items.map((post) => (
          <li key={post.id} className="py-1">
            <FeedPostCard
              post={post}
              currentUserId={currentUserId}
              initialFollowing={followingIds.includes(post.authorId)}
              initialBookmarked={bookmarkedPostIds.includes(post.id)}
              compact
            />
          </li>
        ))}
      </ul>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />

      {loading && (
        <ul className="list-none p-0" role="list" aria-busy="true" aria-label="추가 로딩 중">
          {[1, 2, 3].map((i) => (
            <li key={i}><FeedSkeletonRow /></li>
          ))}
        </ul>
      )}

      {error && (
        <p className="py-4 px-4 text-center text-[13px] text-amber-600" role="alert">
          {error}
        </p>
      )}

      {!loading && nextCursorStr === null && items.length > 0 && (
        <p className="py-8 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border/40">
          모두 확인했습니다 ✓
        </p>
      )}
    </div>
  );
}
