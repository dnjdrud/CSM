"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";
import { loadMoreCounselAction } from "../actions";
import { relativeTimeKo } from "@/lib/utils/time";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

function CounselCard({ post }: { post: PostWithAuthor }) {
  const lines = post.content.split("\n").filter(Boolean);
  const title = lines[0] ?? "";
  const body = lines.slice(1).join(" ").trim();
  const displayTags = (post.tags ?? []).filter(
    (t) => !["고민상담", "신학", "질문", "상담"].includes(t.toLowerCase())
  );

  return (
    <article className="px-4 py-4 border-b border-theme-border/50 last:border-b-0">
      <div className="flex gap-3">
        <div className="w-0.5 rounded-full shrink-0 self-stretch bg-theme-surface-2" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border text-theme-muted bg-theme-surface-2 border-theme-border">
              고민상담
            </span>
            <time dateTime={post.createdAt} className="text-[12px] text-theme-muted ml-auto">
              {relativeTimeKo(post.createdAt)}
            </time>
          </div>

          <Link href={`/post/${post.id}`} className="block group">
            <p className="text-[15px] font-semibold text-theme-text leading-snug group-hover:text-theme-primary transition-colors">
              {title}
            </p>
          </Link>

          {body && (
            <p className="text-[13px] text-theme-muted leading-relaxed line-clamp-2">
              {body}
            </p>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayTags.map((tag) => (
                <span key={tag} className="text-[11px] text-theme-primary/70">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-1.5 group min-w-0">
              <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" className="!h-6 !w-6 !text-[10px]" />
              <span className="text-[12px] text-theme-muted group-hover:text-theme-text transition-colors truncate">
                {post.author.name}
              </span>
            </Link>
            <Link href={`/post/${post.id}`} className="shrink-0 text-[12px] font-medium text-theme-primary hover:opacity-70 transition-opacity ml-3">
              답하기 →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
};

export function CounselInfiniteList({ initialItems, initialNextCursorStr }: Props) {
  const loadMore = useCallback(
    (cursor: string) => loadMoreCounselAction({ cursorStr: cursor }),
    []
  );

  const { items, loading, error, hasMore, sentinelRef } =
    useInfiniteScroll<PostWithAuthor>({
      initialItems,
      initialNextCursorStr,
      loadMore,
    });

  if (items.length === 0 && !loading) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <p className="text-[15px] font-medium text-theme-text">아직 등록된 고민상담이 없습니다</p>
        <p className="text-[14px] text-theme-muted leading-relaxed">
          신앙적 고민이나 신학 질문을 올려주세요.
          <br />
          댓글로 함께 답할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="list-none p-0" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <CounselCard post={post} />
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

      {error && (
        <p className="py-4 px-4 text-center text-[13px] text-theme-warning" role="alert">
          {error}
        </p>
      )}

      {!loading && !hasMore && items.length > 0 && (
        <p className="py-8 px-4 text-center text-[13px] text-theme-muted border-t border-theme-border/40">
          모두 확인했습니다 ✓
        </p>
      )}
    </div>
  );
}
