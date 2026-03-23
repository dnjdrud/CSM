import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser, listPostsByCategory } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "탐색 – Cellah",
};

const CATEGORIES = [
  { key: "DEVOTIONAL",  label: "묵상",   icon: "📖", desc: "말씀과 묵상을 나눠요" },
  { key: "TESTIMONY",   label: "간증",   icon: "✨", desc: "하나님의 역사를 나눠요" },
  { key: "MINISTRY",    label: "사역",   icon: "🌏", desc: "선교와 사역 소식을 나눠요" },
] as const;

function PostSnippet({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="block group p-3 rounded-xl border border-theme-border bg-theme-surface hover:border-theme-primary/40 hover:bg-theme-surface-2/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" className="h-6 w-6 text-[10px]" />
        <span className="text-[12px] font-medium text-theme-text truncate">{post.author.name}</span>
      </div>
      <p className="text-[13px] text-theme-text leading-relaxed line-clamp-3 group-hover:text-theme-primary/90 transition-colors">
        {post.content}
      </p>
      {post.reactionCounts && (post.reactionCounts.prayed + post.reactionCounts.withYou) > 0 && (
        <p className="mt-1.5 text-[11px] text-theme-muted">
          🙏 {post.reactionCounts.prayed + post.reactionCounts.withYou}명이 반응했어요
        </p>
      )}
    </Link>
  );
}

async function CategorySection({ categoryKey, label, icon, desc }: {
  categoryKey: string;
  label: string;
  icon: string;
  desc: string;
}) {
  const posts = await listPostsByCategory(categoryKey, 4);

  return (
    <section>
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>{icon}</span>
          <div>
            <h2 className="text-[15px] font-semibold text-theme-text">{label}</h2>
            <p className="text-[12px] text-theme-muted">{desc}</p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-[13px] text-theme-muted py-4 text-center">
          아직 게시글이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {posts.map((post) => (
            <PostSnippet key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function ExplorePage() {
  const currentUser = await getCurrentUser();

  return (
    <TimelineContainer>
      <div className="px-4 py-4 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-theme-text">탐색</h1>
          <p className="text-[13px] text-theme-muted mt-0.5">신앙 콘텐츠를 발견하세요</p>
        </div>

        {/* Search entry has moved to Contents tab */}
        <Link
          href="/contents"
          className="flex items-center gap-2 w-full rounded-xl border border-theme-border bg-theme-surface-2/50 px-4 py-3 text-[14px] text-theme-muted hover:border-theme-primary/40 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          콘텐츠에서 검색하기…
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/cells" className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-3 py-3 hover:border-theme-primary/40 transition-colors">
            <span className="text-xl" aria-hidden>💬</span>
            <div>
              <p className="text-[13px] font-medium text-theme-text">셀 찾기</p>
              <p className="text-[11px] text-theme-muted">소그룹 공동체</p>
            </div>
          </Link>
          {/* Prayer quick link removed */}
          <Link href="/missions" className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-3 py-3 hover:border-theme-primary/40 transition-colors">
            <span className="text-xl" aria-hidden>🌏</span>
            <div>
              <p className="text-[13px] font-medium text-theme-text">선교</p>
              <p className="text-[11px] text-theme-muted">선교 네트워크</p>
            </div>
          </Link>
          <Link href="/network" className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-3 py-3 hover:border-theme-primary/40 transition-colors">
            <span className="text-xl" aria-hidden>🤝</span>
            <div>
              <p className="text-[13px] font-medium text-theme-text">네트워크</p>
              <p className="text-[11px] text-theme-muted">신앙인 연결</p>
            </div>
          </Link>
        </div>

        {/* Category sections */}
        {CATEGORIES.map((cat) => (
          <Suspense key={cat.key} fallback={
            <div className="space-y-2">
              <div className="h-6 w-32 bg-theme-surface-2 rounded animate-pulse" />
              <div className="h-20 bg-theme-surface-2 rounded-xl animate-pulse" />
            </div>
          }>
            <CategorySection
              categoryKey={cat.key}
              label={cat.label}
              icon={cat.icon}
              desc={cat.desc}
            />
          </Suspense>
        ))}

        {/* Write CTA */}
        {currentUser && (
          <div className="rounded-xl border border-theme-border/60 bg-gradient-to-br from-theme-surface-2/30 to-theme-surface/50 p-4 text-center">
            <p className="text-[14px] text-theme-text font-medium mb-1">나눌 이야기가 있으신가요?</p>
            <p className="text-[12px] text-theme-muted mb-3">기도제목, 묵상, 간증을 공동체와 나눠보세요</p>
            <Link
              href="/write"
              className="inline-flex items-center gap-1.5 rounded-lg bg-theme-primary px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
            >
              ✏️ 글 쓰기
            </Link>
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
