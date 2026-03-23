"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";

type RequestType = {
  label: string;
  color: string;
};

const REQUEST_TYPE_MAP: Record<string, RequestType> = {
  촬영: { label: "촬영 도움", color: "text-theme-muted bg-theme-surface-2 border-theme-border" },
  편집: { label: "편집 도움", color: "text-theme-muted bg-theme-surface-2 border-theme-border" },
  기획: { label: "기획 도움", color: "text-theme-muted bg-theme-surface-2 border-theme-border" },
  교육: { label: "교육/질문", color: "text-theme-muted bg-theme-surface-2 border-theme-border" },
  협업: { label: "협업 제안", color: "text-theme-muted bg-theme-surface-2 border-theme-border" },
};

const FALLBACK_TYPE: RequestType = {
  label: "협업 요청",
  color: "text-theme-muted bg-theme-surface-2 border-theme-border",
};

function getRequestType(tags: string[]): RequestType {
  for (const tag of tags) {
    const match = REQUEST_TYPE_MAP[tag];
    if (match) return match;
  }
  return FALLBACK_TYPE;
}

import { relativeTimeKo } from "@/lib/utils/time";

export function CollabRequestCard({ post }: { post: PostWithAuthor }) {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const requestType = getRequestType(tags);
  const displayTags = tags.filter((t) => !REQUEST_TYPE_MAP[t]);
  const lines = post.content.split("\n").filter(Boolean);
  const title = lines[0] ?? "";
  const body = lines.slice(1).join(" ").trim();

  return (
    <article className="px-4 py-4 border-b border-theme-border/50 last:border-b-0">
      <div className="flex gap-3">
        <div className={`w-0.5 rounded-full shrink-0 self-stretch ${requestType.color.split(" ")[1]}`} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${requestType.color}`}>
              {requestType.label}
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
              협업하기 →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

