"use client";

import { useCallback } from "react";
import { ContentCard } from "./ContentCard";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreContentFeedAction } from "../actions";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

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
  const loadMore = useCallback(
    (cursor: string) => loadMoreContentFeedAction({ cursorStr: cursor }),
    []
  );

  const { items, loading, error, hasMore, sentinelRef } =
    useInfiniteScroll<PostWithAuthor>({
      initialItems,
      initialNextCursorStr,
      loadMore,
    });

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

      {!loading && !hasMore && items.length > 0 && (
        <p className="py-8 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border/40">
          모두 확인했습니다 ✓
        </p>
      )}
    </div>
  );
}
