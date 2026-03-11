"use client";

import { PostCard } from "@/components/PostCard";
import {
  toggleBookmarkAction,
  toggleReactionAction,
  getCommentsForPostAction,
  addCommentAction,
  deletePostAction,
  updatePostAction,
} from "../actions";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  post: PostWithAuthor;
  currentUserId: string | null;
};

export function BookmarkedPostCard({ post, currentUserId }: Props) {
  return (
    <PostCard
      post={post}
      currentUserId={currentUserId}
      initialBookmarked
      onToggleReaction={currentUserId ? toggleReactionAction : undefined}
      onToggleBookmark={currentUserId ? toggleBookmarkAction : undefined}
      getCommentsForPost={getCommentsForPostAction}
      addCommentAction={addCommentAction}
      deletePostAction={deletePostAction}
      updatePostAction={updatePostAction}
    />
  );
}
