"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type CommentWithAuthor = Comment & { author: User };

export function CommentList({
  comments,
  postId,
  currentUserId,
  likeData,
  contentClampLines,
  loading,
  onCommentDeleted,
  onCommentUpdated,
  deleteCommentAction: deleteCommentActionProp,
  updateCommentAction: updateCommentActionProp,
  addCommentAction: addCommentActionProp,
}: {
  comments: CommentWithAuthor[];
  postId: string;
  currentUserId: string | null;
  likeData?: Record<string, { count: number; likedByMe: boolean }>;
  /** Clamp comment body lines for preview UIs (e.g. feed cards). */
  contentClampLines?: 1;
  loading?: boolean;
  onCommentDeleted?: (commentId: string) => void;
  onCommentUpdated?: (commentId: string, content: string) => void;
  deleteCommentAction?: (commentId: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;
  updateCommentAction?: (commentId: string, content: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;
  addCommentAction?: (postId: string, content: string, parentId?: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const handleDeleted = onCommentDeleted ?? (() => router.refresh());
  const handleUpdated = onCommentUpdated ?? (() => router.refresh());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const roots = comments.filter((c) => !c.parentId);
  const byParent = new Map<string, CommentWithAuthor[]>();
  comments.forEach((c) => {
    if (c.parentId) {
      const list = byParent.get(c.parentId) ?? [];
      list.push(c);
      byParent.set(c.parentId, list);
    }
  });

  if (loading) {
    return (
      <ul className="list-none p-0 space-y-4" role="list" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex gap-3 py-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Be the first to respond."
      />
    );
  }

  return (
    <ul className="list-none p-0 space-y-0" role="list">
      {roots.map((root) => (
        <li key={root.id} className="border-b border-theme-border last:border-b-0">
          <CommentItem
            comment={root}
            postId={postId}
            currentUserId={currentUserId}
            initialLikeCount={likeData?.[root.id]?.count ?? 0}
            initialLikedByMe={likeData?.[root.id]?.likedByMe ?? false}
            onDeleted={handleDeleted}
            onUpdated={handleUpdated}
            onReplyClick={currentUserId ? (id) => setReplyingTo(replyingTo === id ? null : id) : undefined}
            deleteCommentAction={deleteCommentActionProp}
            updateCommentAction={updateCommentActionProp}
            contentClampLines={contentClampLines}
          />
          {replyingTo === root.id && currentUserId && (
            <div className="ml-6 pl-3 border-l-2 border-theme-border mt-1 mb-3">
              <CommentForm
                postId={postId}
                parentId={root.id}
                onCancel={() => setReplyingTo(null)}
                onSuccess={() => setReplyingTo(null)}
                addCommentAction={addCommentActionProp}
              />
            </div>
          )}
          {(byParent.get(root.id) ?? []).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              initialLikeCount={likeData?.[reply.id]?.count ?? 0}
              initialLikedByMe={likeData?.[reply.id]?.likedByMe ?? false}
              isReply
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
              deleteCommentAction={deleteCommentActionProp}
              updateCommentAction={updateCommentActionProp}
              contentClampLines={contentClampLines}
            />
          ))}
        </li>
      ))}
    </ul>
  );
}
