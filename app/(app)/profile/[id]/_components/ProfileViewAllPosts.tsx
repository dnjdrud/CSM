"use client";

import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";

const PAGE_SIZE = 30;

type Props = {
  posts: PostWithAuthor[];
  profileId: string;
  currentUserId: string | null;
  blocked?: boolean;
};

/** Expanded list of posts (testimonies or recent) with "Load more" (30 per page). */
export function ProfileViewAllPosts({
  posts,
  profileId,
  currentUserId,
  blocked,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = posts.length > visibleCount;
  const visible = posts.slice(0, visibleCount);

  if (blocked) {
    return <p className="text-sm text-gray-500">You have blocked this user.</p>;
  }
  if (posts.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Posts from this person will show up here."
      />
    );
  }

  return (
    <>
      <ul className="list-none p-0 space-y-4" role="list">
        {visible.map((post) => (
          <li key={post.id}>
            <PostCard post={post} currentUserId={currentUserId} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
