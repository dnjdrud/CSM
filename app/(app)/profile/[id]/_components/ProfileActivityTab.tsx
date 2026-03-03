"use client";

import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
};

/** Activity tab: published posts using PostCard (read-only on profile; click through to post for reactions/comments). */
export function ProfileActivityTab({ posts, currentUserId, blocked }: Props) {
  if (blocked) {
    return <p className="mt-4 text-sm text-gray-500">You have blocked this user.</p>;
  }
  if (posts.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="Nothing here yet"
          description="Posts from this person will show up here."
        />
      </div>
    );
  }
  return (
    <ul className="mt-4 list-none p-0" role="list">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-gray-200 last:border-b-0">
          <PostCard post={post} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}
