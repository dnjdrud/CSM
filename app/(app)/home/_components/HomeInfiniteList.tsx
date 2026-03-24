"use client";

import { useCallback } from "react";
import { FeedPostCard } from "@/app/(app)/feed/_components/FeedPostCard";
import { FeedSkeletonRow } from "@/app/(app)/feed/_components/FeedSkeletonRow";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreHomeFeedAction } from "../actions";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

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
  const loadMore = useCallback(
    (cursor: string) => loadMoreHomeFeedAction({ cursorStr: cursor }),
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
      <EmptyState
        title="피드가 비어있습니다"
        description="팔로우한 사람들의 글이 여기 표시됩니다. 아직 기도 제목을 제외한 나눔 글이 없습니다."
        action={{ label: "사람 찾기", href: "/search" }}
      />
    );
  }

  return (
    <div>
      <ul className="list-none p-0 space-y-4" role="list">
        {items.map((post) => (
          <li key={post.id}>
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

      {!loading && !hasMore && items.length > 0 && (
        <p className="py-8 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border/40">
          모두 확인했습니다 ✓
        </p>
      )}
    </div>
  );
}
