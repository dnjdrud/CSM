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
import { ContentsInfiniteList } from "./_components/ContentsInfiniteList";
import { ContentsBottomSearchBar } from "./_components/ContentsBottomSearchBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "컨텐츠 – Cellah" };

const PAGE_SIZE = 20;
const CONTENT_CATEGORIES = ["CONTENT", "PHOTO", "MISSION"] as const;

export default async function ContentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const currentUser = await getCurrentUser();

  return (
    <TimelineContainer>
      <h1 className="sr-only">컨텐츠</h1>

      <header className="px-4 py-4 border-b border-theme-border bg-theme-surface sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-widest">
              Contents
            </p>
            <h2 className="text-[18px] font-semibold text-theme-text mt-0.5">컨텐츠</h2>
          </div>
          <RavenMark />
        </div>
      </header>

      <ContentTabContent currentUser={currentUser} />

      <ContentsBottomSearchBar />
    </TimelineContainer>
  );
}

function RavenMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-theme-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 15c2.2-6.2 7.2-9.7 14-10 2.2-.1 4 1.7 4 4 0 6.2-5 11-11 11-2.8 0-5.2-1.2-7-3" />
      <path d="M10 18l-3 3" />
      <path d="M14 11l-3 3" />
      <path d="M15 8h.01" />
    </svg>
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
