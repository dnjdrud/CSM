"use client";

import { useCallback } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreMissionHubAction } from "../actions";
import { PostCard } from "@/components/PostCard";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  countryCode?: string | null;
};

export function MissionHubInfiniteList({ initialItems, initialNextCursorStr, countryCode }: Props) {
  // countryCode is in deps: when it changes the server will revalidate with new
  // initialItems (triggering the hook's sync reset), and the new loadMore closure
  // will pass the updated countryCode to the action.
  const loadMore = useCallback(
    (cursor: string) =>
      loadMoreMissionHubAction({ cursorStr: cursor, countryCode: countryCode ?? null }),
    [countryCode]
  );

  const { items, loading, error, hasMore, sentinelRef } =
    useInfiniteScroll<PostWithAuthor>({
      initialItems,
      initialNextCursorStr,
      loadMore,
    });

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

      {!loading && !hasMore && items.length > 0 && (
        <p className="py-8 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border/40">
          모두 확인했습니다 ✓
        </p>
      )}
    </div>
  );
}
