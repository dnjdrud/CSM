"use client";

import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  profileId: string;
  currentUserId: string | null;
  blocked?: boolean;
};

/** Latest 5 posts excluding TESTIMONY. */
export function RecentPosts({
  posts,
  profileId,
  currentUserId,
  blocked,
}: Props) {
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
    <ul className="list-none p-0" role="list">
      {posts.slice(0, 5).map((post) => (
        <li key={post.id} className="border-b border-gray-200 last:border-b-0">
          <PostCard post={post} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}
