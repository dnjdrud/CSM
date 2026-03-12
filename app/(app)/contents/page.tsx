import { Suspense } from "react";
import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getCurrentUser,
  listFeedPostsPage,
  isBlocked,
  isMuted,
} from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { listMySubscriptions } from "@/lib/data/subscriptionRepository";
import { ContentsTabs } from "./_components/ContentsTabs";
import { ContentsInfiniteList } from "./_components/ContentsInfiniteList";
import { RequestInfiniteList } from "./_components/RequestInfiniteList";
import type { ContentsTab } from "./_components/ContentsTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "컨텐츠 – Cellah" };

const PAGE_SIZE = 20;
const CONTENT_CATEGORIES = ["CONTENT", "PHOTO"] as const;

export default async function ContentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab: ContentsTab = params.tab === "request" ? "request" : "content";
  const currentUser = await getCurrentUser();

  return (
    <TimelineContainer>
      <h1 className="sr-only">컨텐츠</h1>

      <Suspense fallback={<div className="h-12 border-b border-theme-border" />}>
        <ContentsTabs activeTab={activeTab} />
      </Suspense>

      {activeTab === "content" ? (
        <ContentTabContent currentUser={currentUser} />
      ) : (
        <RequestTabContent currentUser={currentUser} />
      )}
    </TimelineContainer>
  );
}

/* ─── 콘텐츠 탭 ─────────────────────────────────────────────── */

async function ContentTabContent({
  currentUser,
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const [firstPage, mySubscriptions] = await Promise.all([
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: "ALL",
      limit: PAGE_SIZE,
      cursor: null,
      includeCategories: [...CONTENT_CATEGORIES],
    }),
    currentUser ? listMySubscriptions(currentUser.id) : Promise.resolve([]),
  ]);

  const subscribedCreatorIds = mySubscriptions.map((s) => s.creatorId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, () => false);
      })
    : firstPage.items;

  if (firstPage.error) {
    return (
      <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        콘텐츠를 불러올 수 없습니다. {firstPage.error}
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 설명 */}
      <div className="px-4 py-3 border-b border-theme-border/60 bg-theme-surface-2/30 flex items-center justify-between">
        <p className="text-[12px] text-theme-muted">
          사역자와 크리에이터의 콘텐츠
        </p>
        <a
          href="/write"
          className="text-[12px] font-medium text-theme-primary hover:opacity-80"
        >
          + 콘텐츠 올리기
        </a>
      </div>

      <ContentsInfiniteList
        initialItems={visibleItems}
        initialNextCursorStr={
          firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
        }
        currentUserId={currentUser?.id ?? null}
        subscribedCreatorIds={subscribedCreatorIds}
      />
    </div>
  );
}

/* ─── 요청 탭 ───────────────────────────────────────────────── */

async function RequestTabContent({
  currentUser,
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const firstPage = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
    limit: PAGE_SIZE,
    cursor: null,
    includeCategories: ["REQUEST"],
  });

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, () => false);
      })
    : firstPage.items;

  if (firstPage.error) {
    return (
      <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        요청 목록을 불러올 수 없습니다. {firstPage.error}
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-theme-border/60 bg-theme-surface-2/30 flex items-center justify-between">
        <p className="text-[12px] text-theme-muted">
          콘텐츠 제작 협업 요청 보드
        </p>
        <a
          href="/write"
          className="text-[12px] font-medium text-theme-primary hover:opacity-80"
        >
          + 요청 올리기
        </a>
      </div>

      {/* 안내 배너 */}
      <div className="mx-4 my-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
        <span className="text-xl shrink-0 mt-0.5" aria-hidden>💡</span>
        <div>
          <p className="text-[13px] font-medium text-amber-800">콘텐츠 제작 협업 보드</p>
          <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">
            촬영, 편집, 기획 등 제작 도움이 필요하면 요청을 올려주세요.
            크리에이터가 &apos;협업하기&apos;를 눌러 댓글로 연결됩니다.
          </p>
        </div>
      </div>

      <RequestInfiniteList
        initialItems={visibleItems}
        initialNextCursorStr={
          firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
        }
        currentUserId={currentUser?.id ?? null}
      />
    </div>
  );
}
