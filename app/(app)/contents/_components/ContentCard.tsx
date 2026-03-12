"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";

/* ─── YouTube helpers ────────────────────────────────────────── */

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] ?? null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function embedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

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
};

export function ContentCard({ post }: Props) {
  const youtubeId = post.youtubeUrl ? extractYouTubeId(post.youtubeUrl) : null;
  const [playing, setPlaying] = useState(false);

  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  return (
    <article className="border-b border-theme-border/50 last:border-b-0">
      {/* ── YouTube 썸네일 / 임베드 플레이어 ── */}
      {youtubeId && (
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          {playing ? (
            <iframe
              src={embedUrl(youtubeId)}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="영상 재생"
              className="relative block w-full h-full group"
            >
              <Image
                src={thumbnailUrl(youtubeId)}
                alt="YouTube 썸네일"
                fill
                className="object-cover"
                unoptimized
              />
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              {/* 재생 버튼 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/70 group-hover:bg-black/85 flex items-center justify-center transition-colors shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    className="w-6 h-6 ml-0.5"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>
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
              <span
                key={tag}
                className="text-[11px] text-theme-primary/70"
              >
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
