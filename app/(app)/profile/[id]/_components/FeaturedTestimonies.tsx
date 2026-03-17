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

/** Latest 3 posts with category TESTIMONY. */
export function FeaturedTestimonies({
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
        description="Testimonies shared by this person will appear here."
      />
    );
  }
  return (
    <ul className="list-none p-0" role="list">
      {posts.slice(0, 3).map((post) => (
        <li key={post.id} className="border-b border-theme-border last:border-b-0">
          <PostCard post={post} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}
