"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { CellTopic } from "@/lib/cells/topics";
import { TOPIC_COLOR_CLASSES } from "@/lib/cells/topics";

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

/* ─── CellPostCard ────────────────────────────────────────────── */

function CellPostCard({ post, topicColor }: { post: PostWithAuthor; topicColor: string }) {
  const colors = TOPIC_COLOR_CLASSES[topicColor] ?? TOPIC_COLOR_CLASSES["blue"]!;

  return (
    <article className="px-4 py-4 border-b border-theme-border/50 last:border-b-0">
      {/* 작성자 행 */}
      <div className="flex items-center gap-2.5 mb-2.5">
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
        <time dateTime={post.createdAt} className="text-[12px] text-theme-muted shrink-0">
          {relativeTime(post.createdAt)}
        </time>
      </div>

      {/* 본문 */}
      <Link href={`/post/${post.id}`} className="block group">
        <p className="text-[14px] text-theme-text leading-relaxed line-clamp-4 whitespace-pre-wrap group-hover:text-theme-primary/90 transition-colors pl-[38px]">
          {post.content}
        </p>
        {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
          <div className="mt-2 pl-[38px]">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              <Image src={post.mediaUrls[0]} alt="첨부 사진" fill className="object-contain" unoptimized />
            </div>
          </div>
        )}
      </Link>

      {/* 태그 */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pl-[38px]">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${colors.badge}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 하단 */}
      {(post.commentCount ?? 0) > 0 && (
        <div className="mt-2 pl-[38px]">
          <Link
            href={`/post/${post.id}`}
            className="text-[12px] text-theme-muted hover:text-theme-text transition-colors"
          >
            댓글 {post.commentCount}개 보기
          </Link>
        </div>
      )}
    </article>
  );
}

/* ─── 무한 스크롤 리스트 ────────────────────────────────────── */

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  currentUserId: string | null;
  topic: CellTopic;
};

export function TopicFeedInfiniteList({
  initialItems,
  initialNextCursorStr,
  currentUserId: _currentUserId,
  topic,
}: Props) {
  const [items] = useState<PostWithAuthor[]>(initialItems);
  // Cursor-based pagination for topic feeds is future work (requires DB-level tag filter).
  // For now we render the initial server-fetched batch only.
  const [loading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Placeholder: IntersectionObserver setup preserved for when cursor pagination lands
  const loadMore = useCallback(async () => {
    // Future: call loadMoreTopicFeedAction({ cursorStr: nextCursorStr, topicSlug: topic.slug })
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !initialNextCursorStr) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) loadMore(); },
      { rootMargin: "300px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, initialNextCursorStr]);

  if (items.length === 0 && !loading) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <span className="text-4xl" aria-hidden>{topic.icon}</span>
        <p className="text-[15px] font-medium text-theme-text">
          아직 게시글이 없습니다
        </p>
        <p className="text-[14px] text-theme-muted leading-relaxed">
          첫 번째 게시글을 올려보세요.
          <br />
          글쓰기에서 <strong>셀 나눔</strong>을 선택하고
          <br />
          <strong>{topic.hashtags[0]}</strong> 태그를 추가하면 여기에 표시됩니다.
        </p>
        <Link
          href="/write"
          className="inline-block mt-2 text-[13px] text-theme-primary hover:opacity-80 font-medium"
        >
          글쓰기 →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="list-none p-0" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <CellPostCard post={post} topicColor={topic.color} />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden className="min-h-[1px]" />

      {loading && (
        <div className="py-6 flex justify-center" aria-busy="true">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-theme-muted animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
