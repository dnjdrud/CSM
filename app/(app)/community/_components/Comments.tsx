"use client";

import { useState, useEffect, useCallback } from "react";
import { listCommunityCommentsAction } from "../actions";
import type { CommunityComment } from "../actions";

interface CommentsProps {
  postId: string | null;
  refreshKey: number;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function Comments({ postId, refreshKey }: CommentsProps) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId?.trim()) {
      setComments([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listCommunityCommentsAction(postId);
      if (result.error) setError(result.error);
      else setComments(result.comments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!postId) return null;

  if (loading && comments.length === 0) {
    return (
      <div className="border-t border-theme-border pt-4 mt-4" aria-busy="true">
        <p className="text-sm text-theme-muted">댓글 로딩 중…</p>
        <div className="mt-2 space-y-2">
          <div className="h-12 rounded bg-theme-surface animate-pulse" />
          <div className="h-12 rounded bg-theme-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="border-t border-theme-border pt-4 mt-4">
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-theme-border pt-4 mt-4">
      <h3 className="text-sm font-medium text-theme-text mb-2">
        댓글 {comments.length > 0 ? `(${comments.length})` : ""}
      </h3>
      {comments.length === 0 ? (
        <p className="text-sm text-theme-muted py-2">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="space-y-3" aria-label="댓글 목록">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-theme-border bg-theme-surface/50 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-theme-text">
                  {c.author?.name ?? c.authorId.slice(0, 8)}
                </span>
                <span className="text-xs text-theme-muted">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-theme-text whitespace-pre-wrap">
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
