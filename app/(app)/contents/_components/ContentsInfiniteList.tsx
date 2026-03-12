"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ContentCard } from "./ContentCard";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreContentFeedAction } from "../actions";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  currentUserId: string | null;
  subscribedCreatorIds: string[];
};

export function ContentsInfiniteList({
  initialItems,
  initialNextCursorStr,
  currentUserId,
  subscribedCreatorIds,
}: Props) {
  const [items, setItems] = useState<PostWithAuthor[]>(initialItems);
  const [nextCursorStr, setNextCursorStr] = useState<string | null>(initialNextCursorStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync if server re-renders (e.g. after new post)
  useEffect(() => {
    if (initialItems[0]?.id !== items[0]?.id) {
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
      const result = await loadMoreContentFeedAction({ cursorStr: nextCursorStr });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursorStr(result.nextCursorStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "더 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [nextCursorStr, loading]);

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
      <div className="px-4 py-16 text-center space-y-3">
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium text-theme-text">
          아직 콘텐츠가 없습니다
        </p>
        <p className="text-[14px] text-theme-muted leading-relaxed">
          사역자와 크리에이터의 콘텐츠가 여기에 표시됩니다.
          <br />
          글쓰기에서 <strong>컨텐츠</strong>로 게시글을 올려보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="list-none p-0" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <ContentCard
              post={post}
              currentUserId={currentUserId}
              subscribedCreatorIds={subscribedCreatorIds}
            />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />

      {loading && (
        <div
          className="py-6 flex justify-center"
          aria-label="콘텐츠 불러오는 중"
          aria-busy="true"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
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
