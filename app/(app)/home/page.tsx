import { Suspense } from "react";
import Link from "next/link";
import {
  getCurrentUser,
  listFeedPostsPage,
  listFollowingIds,
  isBlocked,
  isMuted,
  getBookmarkedPostIds,
  getTodaysDailyPrayer,
} from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { HOME_FEED_CATEGORIES } from "@/lib/domain/types";
import { TimelineContainer } from "@/components/TimelineContainer";
import { FeedComposer } from "@/app/(app)/feed/_components/FeedComposer";
import { SuggestedPeople } from "@/app/(app)/feed/_components/SuggestedPeople";
import { HomeTabs } from "./_components/HomeTabs";
import { HomeInfiniteList } from "./_components/HomeInfiniteList";
import { PrayerInfiniteList } from "./_components/PrayerInfiniteList";
import type { HomeTab } from "./_components/HomeTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "홈 – Cellah" };

const FEED_PAGE_SIZE = 20;

function getTodayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab: HomeTab = params.tab === "prayer" ? "prayer" : "feed";
  const currentUser = await getCurrentUser();

  return (
    <TimelineContainer>
      <h1 className="sr-only">홈</h1>

      {/* Feed / Prayer 탭 바 */}
      <Suspense fallback={<div className="h-12 border-b border-theme-border" />}>
        <HomeTabs activeTab={activeTab} />
      </Suspense>

      {activeTab === "feed" ? (
        <FeedTabContent currentUser={currentUser} />
      ) : (
        <PrayerTabContent currentUser={currentUser} />
      )}
    </TimelineContainer>
  );
}

/* ─────────────────────────────────────────── Feed Tab ── */

async function FeedTabContent({
  currentUser,
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const [dailyPrayer, firstPage, followingIds] = await Promise.all([
    getTodaysDailyPrayer(),
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: "FOLLOWING",
      limit: FEED_PAGE_SIZE,
      cursor: null,
      includeCategories: HOME_FEED_CATEGORIES,
    }),
    currentUser ? listFollowingIds(currentUser.id) : Promise.resolve([]),
  ]);

  const bookmarkedPostIds = currentUser
    ? await getBookmarkedPostIds(
        currentUser.id,
        firstPage.items.map((p) => p.id)
      )
    : [];

  const isFollowingFn = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, isFollowingFn);
      })
    : firstPage.items;

  return (
    <div>
      {/* 오늘의 기도 배너 — Prayer 탭 진입 유도 */}
      <DailyPrayerBanner dailyPrayer={dailyPrayer} />

      {/* 글쓰기 */}
      {currentUser && (
        <div className="border-b border-theme-border/60 px-4 py-3">
          <FeedComposer />
        </div>
      )}

      {/* 팔로우 0명일 때 추천 사람 */}
      {currentUser && followingIds.length === 0 && (
        <Suspense fallback={null}>
          <SuggestedPeople currentUserId={currentUser.id} role={currentUser.role} />
        </Suspense>
      )}

      {/* 피드 목록 */}
      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          피드를 불러올 수 없습니다. {firstPage.error}
        </div>
      ) : (
        <HomeInfiniteList
          initialItems={visibleItems}
          initialNextCursorStr={
            firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
          }
          currentUserId={currentUser?.id ?? null}
          followingIds={followingIds}
          bookmarkedPostIds={bookmarkedPostIds}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────── Daily Prayer Banner ── */

function DailyPrayerBanner({
  dailyPrayer,
}: {
  dailyPrayer: { id: string; content: string } | null;
}) {
  return (
    <div className="border-b border-theme-border/60 bg-gradient-to-b from-theme-surface-2/40 to-transparent px-4 py-4">
      <p className="text-[11px] font-medium text-theme-muted uppercase tracking-wider mb-2">
        {getTodayLabel()}
      </p>
      {dailyPrayer ? (
        <Link href={`/post/${dailyPrayer.id}`} className="block group">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden>🙏</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-theme-text group-hover:text-theme-primary transition-colors">
                오늘의 기도
              </p>
              <p className="text-[14px] text-theme-text leading-relaxed line-clamp-2 mt-0.5">
                {dailyPrayer.content}
              </p>
              <p className="text-[12px] text-theme-primary mt-1.5 font-medium">
                함께 기도하기 →
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/home?tab=prayer" className="flex items-center gap-3 group">
          <span className="text-xl shrink-0" aria-hidden>🙏</span>
          <p className="text-[14px] text-theme-muted group-hover:text-theme-primary transition-colors">
            기도 게시판 보기 →
          </p>
        </Link>
      )}
    </div>
  );
}

/* ──────────────────────────────────── Prayer Tab ── */

async function PrayerTabContent({
  currentUser,
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const [firstPage, followingIds] = await Promise.all([
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: "FOLLOWING",
      limit: FEED_PAGE_SIZE,
      cursor: null,
      includeCategories: ["PRAYER"],
    }),
    currentUser ? listFollowingIds(currentUser.id) : Promise.resolve([]),
  ]);

  const isFollowingFn = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, isFollowingFn);
      })
    : firstPage.items;

  return (
    <div>
      {/* 기도 제목 쓰기 / 내 기도 제목 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/60 bg-theme-surface-2/30">
        <p className="text-[12px] text-theme-muted">
          팔로우한 사람들의 기도 제목
        </p>
        <div className="flex items-center gap-3">
          <Link href="/prayer/my" className="text-[12px] text-theme-muted hover:text-theme-text">
            내 기도
          </Link>
          <Link
            href="/prayer/create"
            className="text-[12px] font-medium text-theme-primary hover:opacity-80"
          >
            + 기도 제목
          </Link>
        </div>
      </div>

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          기도 제목을 불러올 수 없습니다. {firstPage.error}
        </div>
      ) : (
        <PrayerInfiniteList
          initialItems={visibleItems}
          initialNextCursorStr={
            firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
          }
          currentUserId={currentUser?.id ?? null}
        />
      )}
    </div>
  );
}
