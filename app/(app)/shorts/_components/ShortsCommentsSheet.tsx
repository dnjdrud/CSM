"use client";

import { useState, useEffect, useRef } from "react";
import { CommentForm } from "@/app/(app)/post/[id]/_components/CommentForm";
import { CommentList } from "@/app/(app)/post/[id]/_components/CommentList";
import {
  addCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/app/(app)/post/[id]/actions";
import { getShortCommentsAction } from "../actions";
import type { Comment, User } from "@/lib/domain/types";

type CommentWithAuthor = Comment & { author: User };

type Props = {
  postId: string;
  currentUserId: string | null;
  commentCount: number;
  onClose: () => void;
};

export function ShortsCommentsSheet({
  postId,
  currentUserId,
  commentCount,
  onClose,
}: Props) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getShortCommentsAction(postId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [postId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const displayCount = comments.length > 0 ? comments.length : commentCount;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-theme-surface rounded-t-2xl flex flex-col"
        style={{ maxHeight: "70dvh" }}
        role="dialog"
        aria-modal
        aria-label="댓글"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-theme-border" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 shrink-0 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-theme-text">
            댓글{displayCount > 0 ? ` ${displayCount}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-theme-muted text-[13px] hover:text-theme-text transition-colors"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          {loading ? (
            <p className="py-6 text-[13px] text-theme-muted text-center">
              불러오는 중…
            </p>
          ) : (
            <CommentList
              comments={comments}
              postId={postId}
              currentUserId={currentUserId}
              likeData={{}}
              onCommentDeleted={(id) =>
                setComments((prev) => prev.filter((c) => c.id !== id))
              }
              onCommentUpdated={(id, content) =>
                setComments((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, content } : c))
                )
              }
              deleteCommentAction={deleteCommentAction}
              updateCommentAction={updateCommentAction}
              addCommentAction={addCommentAction}
            />
          )}
        </div>

        {/* Input */}
        {currentUserId && (
          <div className="px-4 pt-2 pb-6 border-t border-theme-border shrink-0">
            <CommentForm
              postId={postId}
              onSuccess={() =>
                getShortCommentsAction(postId).then(setComments)
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
