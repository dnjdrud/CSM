"use client";

import { PostCard } from "@/components/PostCard";
import {
  toggleReactionAction,
  toggleBookmarkAction,
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
  /** Whether current user follows the post author (for Follow button). */
  initialFollowing: boolean;
  initialBookmarked?: boolean;
  compact?: boolean;
};

/** PostCard wired to feed route actions (reaction, comments, post edit/delete, follow, bookmark). */
export function FeedPostCard({ post, currentUserId, initialFollowing, initialBookmarked = false, compact = false }: Props) {
  return (
    <PostCard
      post={post}
      currentUserId={currentUserId}
      initialFollowing={initialFollowing}
      initialBookmarked={initialBookmarked}
      compact={compact}
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
