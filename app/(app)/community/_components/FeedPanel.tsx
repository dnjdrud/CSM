"use client";

import { useRouter } from "next/navigation";
import type { CommunityPost } from "@/lib/data/communityRepository";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function titleOrPreview(post: CommunityPost, maxLen = 60): string {
  const t = post.title?.trim();
  if (t) return t;
  const c = post.content?.trim() ?? "";
  if (c.length <= maxLen) return c || "Untitled";
  return c.slice(0, maxLen) + "…";
}

interface FeedPanelProps {
  posts: CommunityPost[];
  selectedId: string | null;
  fetchError: string | null;
}

export function FeedPanel({ posts, selectedId, fetchError }: FeedPanelProps) {
  const router = useRouter();

  if (fetchError) {
    return (
      <div className="p-4 text-red-600 text-sm" role="alert">
        {fetchError}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-6 text-theme-muted text-sm text-center">
        No posts yet.
      </div>
    );
  }

  return (
    <ul className="list-none p-0 m-0" role="list">
      {posts.map((post) => {
        const isSelected = selectedId === post.id;
        return (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => router.push(`/community?post=${post.id}`, { scroll: false })}
              className="w-full text-left p-4 border-b border-theme-border hover:bg-theme-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-inset transition-colors"
              style={{
                backgroundColor: isSelected ? "var(--surface-2)" : undefined,
              }}
              aria-pressed={isSelected}
              aria-label={`Open ${titleOrPreview(post)}`}
            >
              <div className="aspect-video w-full rounded-md bg-theme-surface-2 overflow-hidden mb-2">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-theme-muted text-xs"
                    aria-hidden
                  >
                    No image
                  </div>
                )}
              </div>
              <p className="font-medium text-theme-text text-sm line-clamp-2">
                {titleOrPreview(post)}
              </p>
              <p className="text-theme-muted text-xs mt-0.5">
                {formatDate(post.created_at)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
