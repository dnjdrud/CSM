"use client";

import { useState } from "react";
import type { CommunityPost } from "@/lib/data/communityRepository";
import { Comments } from "./Comments";
import { CommentForm } from "./CommentForm";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

interface ContentPanelProps {
  post: CommunityPost | null;
  postError: string | null;
  onBackToFeed: () => void;
  showBackButton: boolean;
  currentUserId: string | null;
}

export function ContentPanel({
  post,
  postError,
  onBackToFeed,
  showBackButton,
  currentUserId,
}: ContentPanelProps) {
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
  if (postError) {
    return (
      <div className="p-6" role="alert">
        <p className="text-red-600 text-sm">{postError}</p>
        {showBackButton && (
          <button
            type="button"
            onClick={onBackToFeed}
            className="mt-4 text-sm text-theme-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
          >
            ← Back to Feed
          </button>
        )}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <p className="text-theme-muted text-sm">
          왼쪽에서 게시물을 선택하세요.
        </p>
        <p className="text-theme-muted text-xs mt-1">
          Select a post from the left.
        </p>
      </div>
    );
  }

  const title = post.title?.trim() || post.content?.trim()?.slice(0, 80) + (post.content && post.content.length > 80 ? "…" : "") || "Untitled";

  return (
    <article className="flex flex-col h-full" aria-label={title}>
      {/* Sticky area: player + title */}
      <div className="sticky top-0 z-10 bg-theme-bg border-b border-theme-border shrink-0">
        {post.youtube_id && (
          <div className="aspect-video w-full bg-black">
            <iframe
              title={`YouTube: ${title}`}
              src={`https://www.youtube.com/embed/${post.youtube_id}`}
              allowFullScreen
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
        <div className="p-4">
          <h1 className="text-lg font-semibold text-theme-text">{title}</h1>
          <p className="text-theme-muted text-xs mt-1">{formatDate(post.created_at)}</p>
        </div>
      </div>

      <div className="p-4 flex-1">
        {showBackButton && (
          <button
            type="button"
            onClick={onBackToFeed}
            className="mb-4 text-sm text-theme-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
            aria-label="Back to Feed"
          >
            ← 뒤로 (Feed)
          </button>
        )}
        {post.content?.trim() && (
          <div className="prose prose-sm max-w-none text-theme-text whitespace-pre-wrap">
            {post.content.trim()}
          </div>
        )}

        <Comments postId={post.id} refreshKey={commentsRefreshKey} />
        <CommentForm
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={() => setCommentsRefreshKey((k) => k + 1)}
        />
      </div>
    </article>
  );
}
