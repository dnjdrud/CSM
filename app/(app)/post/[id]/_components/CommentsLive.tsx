"use client";

import { useState } from "react";
import type { Comment, User } from "@/lib/domain/types";
import { CommentList } from "./CommentList";
import { useRealtimeComments } from "./useRealtimeComments";
import { addCommentAction, deleteCommentAction, updateCommentAction } from "../actions";

type CommentWithAuthor = Comment & { author: User };

type Props = {
  postId: string;
  currentUserId: string | null;
  initialComments: CommentWithAuthor[];
  likeData: Record<string, { count: number; likedByMe: boolean }>;
};

export function CommentsLive({ postId, currentUserId, initialComments, likeData }: Props) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);

  useRealtimeComments(postId, setComments);

  return (
    <CommentList
      comments={comments}
      postId={postId}
      currentUserId={currentUserId}
      likeData={likeData}
      onCommentDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
      onCommentUpdated={(id, content) =>
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content } : c)))
      }
      deleteCommentAction={deleteCommentAction}
      updateCommentAction={updateCommentAction}
      addCommentAction={addCommentAction}
    />
  );
}
