"use client";

import { useCallback } from "react";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreCollabRequestsAction } from "../actions";
import { CollabRequestCard } from "./CollabRequestCard";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
};

export function CollabRequestsInfiniteList({ initialItems, initialNextCursorStr }: Props) {
  const loadMore = useCallback(
    (cursor: string) => loadMoreCollabRequestsAction({ cursorStr: cursor }),
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
        <p className="text-[15px] font-medium text-theme-text">아직 등록된 협업 요청이 없습니다</p>
        <p className="text-[14px] text-theme-muted leading-relaxed">
          촬영, 편집, 기획 등 제작 도움이 필요하면 글을 올려주세요.
          <br />
          댓글로 협업을 연결할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="list-none p-0" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <CollabRequestCard post={post} />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />

      {loading && (
        <div className="py-6 flex justify-center" aria-label="협업 요청 불러오는 중" aria-busy="true">
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
