"use client";

import { PostCard } from "@/components/PostCard";
import {
  toggleBookmarkAction,
  toggleReactionAction,
  getCommentsForPostAction,
  getReactorsAction,
  addCommentAction,
  deleteCommentAction,
  updateCommentAction,
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
      getReactorsAction={getReactorsAction}
      getCommentsForPost={getCommentsForPostAction}
      addCommentAction={addCommentAction}
      deleteCommentAction={deleteCommentAction}
      updateCommentAction={updateCommentAction}
      deletePostAction={deletePostAction}
      updatePostAction={updatePostAction}
    />
  );
}
