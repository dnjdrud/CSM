"use client";

import { useState } from "react";
import { addCommentAction } from "../actions";

const CONTENT_MAX_LENGTH = 500;

interface CommentFormProps {
  postId: string;
  currentUserId: string | null;
  onCommentAdded: () => void;
}

export function CommentForm({
  postId,
  currentUserId,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = content.trim();
    if (!trimmed || !currentUserId) return;
    if (trimmed.length > CONTENT_MAX_LENGTH) {
      setError(`댓글은 ${CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await addCommentAction(postId, trimmed);
      if (result.ok) {
        setContent("");
        onCommentAdded();
      } else {
        setError(result.error);
      }
    } catch {
      setError("댓글 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !currentUserId || submitting;

  return (
    <div className="border-t border-theme-border pt-4 mt-4">
      <h3 className="text-sm font-medium text-theme-text mb-2">댓글</h3>
      {!currentUserId ? (
        <p className="text-sm text-theme-muted py-2">
          로그인 후 댓글을 달 수 있습니다.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentUserId ? "댓글을 입력하세요…" : "로그인 후 이용해 주세요."}
          disabled={disabled}
          maxLength={CONTENT_MAX_LENGTH + 50}
          rows={3}
          className="w-full rounded-md border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="댓글 입력"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-theme-muted">
            {content.length}/{CONTENT_MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className="rounded-md bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중…" : "댓글 달기"}
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
