import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { listFeedPostsPage, getCurrentUser } from "@/lib/data/repository";
import { encodeCursor } from "@/lib/domain/pagination";
import { filterVisiblePosts } from "@/backend/features/feed/feedFilters";
import { CollabRequestsInfiniteList } from "./_components/CollabRequestsInfiniteList";

// DISCONNECTED: board card removed from /cells hub in 2026 Q1 surface cleanup.
// Accessible only via direct URL. See docs/PRODUCT_SURFACE.md — future deletion candidate.
export const dynamic = "force-dynamic";
export const metadata = { title: "협업 요청 – Cellah" };

const PAGE_SIZE = 20;

export default async function CollabRequestsPage() {
  const currentUser = await getCurrentUser();

  const firstPage = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
    limit: PAGE_SIZE,
    cursor: null,
    includeCategories: ["REQUEST"],
  });

  const visibleItems = filterVisiblePosts(firstPage.items, currentUser);

  return (
    <TimelineContainer>
      <header className="px-4 pt-5 pb-4 border-b border-theme-border bg-theme-surface sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-widest">
              Cellah 셀 보드
            </p>
            <h1 className="text-[18px] font-semibold text-theme-text mt-0.5">협업 요청</h1>
            <p className="text-[13px] text-theme-muted mt-1 leading-relaxed">
              촬영, 편집, 기획 등 제작 도움이 필요하면 요청을 올려주세요.
            </p>
          </div>
          <Link
            href="/cells"
            className="text-[12px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded shrink-0"
          >
            ← 셀로
          </Link>
        </div>
      </header>

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          협업 요청을 불러올 수 없습니다. {firstPage.error}
        </div>
      ) : (
        <CollabRequestsInfiniteList
          initialItems={visibleItems}
          initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
        />
      )}
    </TimelineContainer>
  );
}

