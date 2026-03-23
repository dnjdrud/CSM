import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { listFeedPostsPage, getCurrentUser } from "@/lib/data/repository";
import { encodeCursor } from "@/lib/domain/pagination";
import { filterVisiblePosts, hasCounselTag } from "@/backend/features/feed/feedFilters";
import { CounselInfiniteList } from "./_components/CounselInfiniteList";

export const dynamic = "force-dynamic";
export const metadata = { title: "고민상담 – Cellah" };

const PAGE_SIZE = 40;

export default async function CounselPage() {
  const currentUser = await getCurrentUser();

  const firstPage = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
    limit: PAGE_SIZE,
    cursor: null,
    includeCategories: ["CELL", "GENERAL", "DEVOTIONAL"],
  });

  const visibleItems = filterVisiblePosts(firstPage.items, currentUser)
    .filter((post) => hasCounselTag(post.tags));

  return (
    <TimelineContainer>
      <header className="px-4 pt-5 pb-4 border-b border-theme-border bg-theme-surface sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-widest">
              Cellah 셀 보드
            </p>
            <h1 className="text-[18px] font-semibold text-theme-text mt-0.5">고민상담</h1>
            <p className="text-[13px] text-theme-muted mt-1 leading-relaxed">
              신앙 고민과 신학 질문을 올리고 함께 답해요.
            </p>
          </div>
          <Link
            href="/cells"
            className="text-[12px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded shrink-0"
          >
            ← 셀로
          </Link>
        </div>
        <div className="mt-3">
          <Link
            href="/write?category=CELL&tag=고민상담"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-xl bg-theme-primary text-white hover:opacity-90 transition-opacity"
          >
            + 질문·고민 올리기
          </Link>
        </div>
      </header>

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          게시글을 불러올 수 없습니다. {firstPage.error}
        </div>
      ) : (
        <CounselInfiniteList
          initialItems={visibleItems}
          initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
        />
      )}
    </TimelineContainer>
  );
}
