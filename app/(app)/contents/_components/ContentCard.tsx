"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";
import type { PostWithAuthor } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";

/* ─── Time helper ────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;
  if (h < 24) return `${h}시간`;
  if (d < 7) return `${d}일`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/* ─── Main component ─────────────────────────────────────────── */

type Props = {
  post: PostWithAuthor;
  currentUserId: string | null;
  /** Creator IDs the current user already subscribes to (for initial button state) */
  subscribedCreatorIds?: string[];
};

export function ContentCard({ post, currentUserId, subscribedCreatorIds = [] }: Props) {
  const isOwnPost = currentUserId === post.author.id;
  const isSubscribed = subscribedCreatorIds.includes(post.author.id);
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  return (
    <article className="border-b border-theme-border/50 last:border-b-0">
      {/* ── YouTube 썸네일 / 임베드 플레이어 ── */}
      {post.youtubeUrl && (
        <YouTubeEmbed url={post.youtubeUrl} mode="player" />
      )}

      {/* ── 텍스트 영역 ── */}
      <div className="px-4 py-3">
        {/* 작성자 행 */}
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={`/profile/${post.author.id}`}
            className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-full"
          >
            <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${post.author.id}`}
              className="text-[13px] font-medium text-theme-text hover:underline"
            >
              {post.author.name}
            </Link>
          </div>

          {/* 까마귀 되기 (본인 게시글 제외) */}
          {!isOwnPost && (
            <SubscribeButton
              creatorId={post.author.id}
              initialIsSubscribed={isSubscribed}
              isLoggedIn={!!currentUserId}
              variant="compact"
            />
          )}

          {/* 카테고리 배지 */}
          <span className="shrink-0 text-[11px] font-medium text-theme-primary/80 bg-theme-primary/10 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>

          <time
            dateTime={post.createdAt}
            className="shrink-0 text-[12px] text-theme-muted"
          >
            {relativeTime(post.createdAt)}
          </time>
        </div>

        {/* 본문 */}
        <Link href={`/post/${post.id}`} className="block group">
          <p className="text-[14px] text-theme-text leading-relaxed line-clamp-3 group-hover:text-theme-primary/90 transition-colors whitespace-pre-wrap">
            {post.content}
          </p>
        </Link>

        {/* 태그 */}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-theme-primary/70">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 — 게시글 링크 */}
        <div className="mt-2.5 flex items-center justify-between">
          {post.commentCount != null && post.commentCount > 0 && (
            <Link
              href={`/post/${post.id}`}
              className="text-[12px] text-theme-muted hover:text-theme-text transition-colors"
            >
              댓글 {post.commentCount}개
            </Link>
          )}
          <Link
            href={`/post/${post.id}`}
            className="ml-auto text-[12px] text-theme-primary hover:opacity-70 transition-opacity"
          >
            자세히 보기 →
          </Link>
        </div>
      </div>
    </article>
  );
}
