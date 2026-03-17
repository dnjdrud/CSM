"use client";

import { useState, useTransition } from "react";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  profileId: string;
  currentUserId: string | null;
  blocked?: boolean;
  initialHasMore?: boolean;
  loadMoreAction?: (profileId: string, offset: number) => Promise<{ items: PostWithAuthor[]; hasMore: boolean }>;
};

export function ProfileViewAllPosts({
  posts: initialPosts,
  profileId,
  currentUserId,
  blocked,
  initialHasMore = false,
  loadMoreAction,
}: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!loadMoreAction) return;
    startTransition(async () => {
      const result = await loadMoreAction(profileId, posts.length);
      setPosts((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    });
  }

  if (blocked) {
    return <p className="text-sm text-gray-500">차단한 사용자입니다.</p>;
  }
  if (posts.length === 0) {
    return (
      <EmptyState
        title="아직 포스트가 없어요"
        description="이 분의 포스트가 여기에 표시됩니다."
      />
    );
  }

  return (
    <>
      <ul className="list-none p-0 space-y-4" role="list">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} currentUserId={currentUserId} />
          </li>
        ))}
      </ul>
      {hasMore && loadMoreAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {isPending ? "불러오는 중…" : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
