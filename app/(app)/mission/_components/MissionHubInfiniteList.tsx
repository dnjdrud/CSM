"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreMissionHubAction } from "../actions";
import { PostCard } from "@/components/PostCard";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  countryCode?: string | null;
};

export function MissionHubInfiniteList({ initialItems, initialNextCursorStr, countryCode }: Props) {
  const [items, setItems] = useState<PostWithAuthor[]>(initialItems);
  const [nextCursorStr, setNextCursorStr] = useState<string | null>(initialNextCursorStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      const result = await loadMoreMissionHubAction({ cursorStr: nextCursorStr, countryCode: countryCode ?? null });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursorStr(result.nextCursorStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "더 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [nextCursorStr, loading, countryCode]);

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
      <div className="px-4 py-16 text-center space-y-2">
        <p className="text-[15px] font-medium text-theme-text">아직 선교 소식이 없습니다</p>
        <p className="text-[13px] text-theme-muted leading-relaxed">
          선교 업데이트 게시글에 <strong>#mission</strong> (또는 선교 카테고리) 태그가 포함되면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="list-none p-0 space-y-4" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <PostCard post={post} compact />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />

      {loading && (
        <div className="py-6 flex justify-center" aria-label="선교 피드 불러오는 중" aria-busy="true">
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

