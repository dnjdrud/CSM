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
import { getUserInteractions, getUserInterestTags } from "@/lib/data/supabaseRepository";
import { rankPosts, type UserSignals } from "@/lib/recommendation/scorer";
import { ContentsInfiniteList } from "./_components/ContentsInfiniteList";
import { ContentsBottomSearchBar } from "./_components/ContentsBottomSearchBar";
import { IconFeather } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "컨텐츠 – Cellah" };

const PAGE_SIZE = 20;

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
          <ContentsHeaderIcon />
        </div>
      </header>

      <ContentsBottomSearchBar position="top" />

      <ContentTabContent currentUser={currentUser} />
    </TimelineContainer>
  );
}

function ContentsHeaderIcon() {
  return <IconFeather className="h-6 w-6 text-theme-muted" aria-hidden />;
}

/* ─── 콘텐츠 탭 ─────────────────────────────────────────────── */

async function ContentTabContent({
  currentUser,
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const CANDIDATE_SIZE = PAGE_SIZE * 3; // fetch more to score before trimming

  const [firstPage, mySubscriptions, interactions, interestTags] = await Promise.all([
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: "ALL",
      limit: CANDIDATE_SIZE,
      cursor: null,
      requireYoutubeUrl: true,
    }),
    currentUser ? listMySubscriptions(currentUser.id) : Promise.resolve([]),
    currentUser ? getUserInteractions(currentUser.id, 200) : Promise.resolve([]),
    currentUser ? getUserInterestTags(currentUser.id) : Promise.resolve([]),
  ]);

  const subscribedCreatorIds = mySubscriptions.map((s) => s.creatorId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, () => false);
      })
    : firstPage.items;

  // Build signals and rank — falls back to recency if no signal data
  const signals: UserSignals = {
    interestTags: new Map(interestTags.map((t) => [t.tag, t.weight])),
    likedPostIds: new Set(
      interactions.filter((i) => i.interactionType === "like").map((i) => i.postId)
    ),
    bookmarkedAuthorIds: new Set(
      interactions
        .filter((i) => i.interactionType === "bookmark")
        .map((i) => visibleItems.find((p) => p.id === i.postId)?.authorId)
        .filter((id): id is string => !!id)
    ),
    watchedAuthorIds: new Set(
      interactions
        .filter((i) => i.interactionType === "view" && (i.watchTimeSeconds ?? 0) > 60)
        .map((i) => visibleItems.find((p) => p.id === i.postId)?.authorId)
        .filter((id): id is string => !!id)
    ),
    subscribedCreatorIds: new Set(subscribedCreatorIds),
  };

  const rankedItems = currentUser
    ? rankPosts(visibleItems, signals).slice(0, PAGE_SIZE)
    : visibleItems.slice(0, PAGE_SIZE);

  if (firstPage.error) {
    return (
      <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        콘텐츠를 불러올 수 없습니다. {firstPage.error}
      </div>
    );
  }

  return (
    <div>
      {/* 게시판 */}
      <div className="px-4 py-3 border-b border-theme-border/60">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wide">게시판</p>
          <a href="/write" className="text-[12px] font-medium text-theme-primary hover:opacity-80">
            + 콘텐츠 올리기
          </a>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <a
            href="/mission"
            className="flex items-center gap-3 rounded-xl border border-theme-border px-3 py-2.5 bg-theme-surface hover:bg-theme-surface-2 transition-colors"
          >
            <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-theme-surface-2 shrink-0" aria-hidden>🌍</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-theme-text">선교</p>
              <p className="text-[11px] text-theme-muted truncate">선교 현장 소식과 기도 요청</p>
            </div>
          </a>
        </div>
      </div>

      <ContentsInfiniteList
        initialItems={rankedItems}
        initialNextCursorStr={
          firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
        }
        currentUserId={currentUser?.id ?? null}
        subscribedCreatorIds={subscribedCreatorIds}
      />
    </div>
  );
}
