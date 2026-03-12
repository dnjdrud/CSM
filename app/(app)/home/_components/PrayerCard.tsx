"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";
import { togglePrayerAction } from "../actions";

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

type Props = {
  post: PostWithAuthor;
  currentUserId: string | null;
};

export function PrayerCard({ post, currentUserId }: Props) {
  const initialPrayed = post.reactionsByCurrentUser?.prayed ?? false;
  const initialCount = post.reactionCounts?.prayed ?? 0;

  const [prayed, setPrayed] = useState(initialPrayed);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handlePray() {
    if (!currentUserId || pending) return;

    // Optimistic update
    const turningOn = !prayed;
    setPrayed(turningOn);
    setCount((c) => (turningOn ? c + 1 : Math.max(0, c - 1)));
    setPending(true);

    const result = await togglePrayerAction(post.id);
    setPending(false);

    if (!result.ok) {
      // Rollback on error
      setPrayed(!turningOn);
      setCount((c) => (turningOn ? Math.max(0, c - 1) : c + 1));
    }
  }

  return (
    <article className="px-4 py-4 border-b border-theme-border/50 last:border-b-0">
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <Link href={`/profile/${post.author.id}`} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-full">
          <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.author.id}`}
            className="text-[14px] font-medium text-theme-text hover:underline"
          >
            {post.author.name}
          </Link>
        </div>
        <time
          dateTime={post.createdAt}
          className="text-[12px] text-theme-muted shrink-0"
        >
          {relativeTime(post.createdAt)}
        </time>
      </div>

      {/* Content */}
      <p className="text-[15px] text-theme-text leading-relaxed whitespace-pre-wrap pl-[38px]">
        {post.content}
      </p>

      {/* Tags */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pl-[38px]">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[12px] text-theme-primary/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Prayer button — only reaction allowed */}
      <div className="mt-3 pl-[38px]">
        {currentUserId ? (
          <button
            type="button"
            onClick={handlePray}
            disabled={pending}
            aria-pressed={prayed}
            aria-label={prayed ? "기도 취소" : "기도했습니다"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-150 disabled:opacity-60 ${
              prayed
                ? "bg-theme-primary/10 border-theme-primary/40 text-theme-primary"
                : "bg-transparent border-theme-border text-theme-muted hover:border-theme-primary/40 hover:text-theme-primary"
            }`}
          >
            <span aria-hidden className={`text-base transition-transform duration-150 ${prayed ? "scale-110" : ""}`}>
              🙏
            </span>
            <span>기도했습니다</span>
            {count > 0 && (
              <span className={`tabular-nums ${prayed ? "text-theme-primary" : "text-theme-muted"}`}>
                {count}
              </span>
            )}
          </button>
        ) : (
          /* 비로그인 시 — 카운트만 표시 */
          count > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-theme-muted">
              <span aria-hidden>🙏</span>
              <span>{count}명이 기도했습니다</span>
            </span>
          ) : null
        )}
      </div>
    </article>
  );
}
