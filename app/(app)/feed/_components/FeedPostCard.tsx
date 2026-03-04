"use client";

import { PostCard } from "@/components/PostCard";
import {
  toggleReactionAction,
  getCommentsForPostAction,
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
  compact?: boolean;
};

/** PostCard wired to feed route actions (reaction, comments, post edit/delete). */
export function FeedPostCard({ post, currentUserId, compact = false }: Props) {
  return (
    <PostCard
      post={post}
      currentUserId={currentUserId}
      compact={compact}
      onToggleReaction={toggleReactionAction}
      getCommentsForPost={getCommentsForPostAction}
      addCommentAction={addCommentAction}
      deleteCommentAction={deleteCommentAction}
      updateCommentAction={updateCommentAction}
      deletePostAction={deletePostAction}
      updatePostAction={updatePostAction}
    />
  );
}
