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
  listPrayerRequests,
} from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { HOME_FEED_CATEGORIES, PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";
import { TimelineContainer } from "@/components/TimelineContainer";
import { FeedComposer } from "@/app/(app)/feed/_components/FeedComposer";
import { SuggestedPeople } from "@/app/(app)/feed/_components/SuggestedPeople";
import { HomeTabs } from "./_components/HomeTabs";
import { HomeInfiniteList } from "./_components/HomeInfiniteList";
import type { HomeTab } from "./_components/HomeTabs";
import { getRoleUX } from "@/lib/config/roleUX";
import { getServerT, getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "홈 – Cellah" };

const FEED_PAGE_SIZE = 20;

function getTodayLabel(locale: string): string {
  return new Date().toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
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
  const t = await getServerT();
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
      <DailyPrayerBanner dailyPrayer={dailyPrayer} />

      {currentUser && (
        <div className="border-b border-theme-border/60 px-4 py-3 space-y-2">
          <p className="text-[12px] text-theme-muted">
            {getRoleUX(currentUser.role).homeCta}
          </p>
          <FeedComposer />
        </div>
      )}

      {currentUser && followingIds.length === 0 && (
        <Suspense fallback={null}>
          <SuggestedPeople currentUserId={currentUser.id} role={currentUser.role} />
        </Suspense>
      )}

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t.home.feedError} {firstPage.error}
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

async function DailyPrayerBanner({
  dailyPrayer,
}: {
  dailyPrayer: { id: string; content: string } | null;
}) {
  const t = await getServerT();
  const locale = await getServerLocale();

  return (
    <div className="border-b border-theme-border/60 bg-gradient-to-b from-theme-surface-2/40 to-transparent px-4 py-4">
      <p className="text-[11px] font-medium text-theme-muted uppercase tracking-wider mb-2">
        {getTodayLabel(locale)}
      </p>
      {dailyPrayer ? (
        <Link href={`/post/${dailyPrayer.id}`} className="block group">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden>🙏</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-theme-text group-hover:text-theme-primary transition-colors">
                {t.home.dailyPrayer}
              </p>
              <p className="text-[14px] text-theme-text leading-relaxed line-clamp-2 mt-0.5">
                {dailyPrayer.content}
              </p>
              <p className="text-[12px] text-theme-primary mt-1.5 font-medium">
                {t.home.prayTogether}
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/home?tab=prayer" className="flex items-center gap-3 group">
          <span className="text-xl shrink-0" aria-hidden>🙏</span>
          <p className="text-[14px] text-theme-muted group-hover:text-theme-primary transition-colors">
            {t.home.viewPrayerBoard}
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
  const t = await getServerT();
  const followingIds = currentUser
    ? await listFollowingIds(currentUser.id)
    : [];

  const userIds = currentUser
    ? [...new Set([currentUser.id, ...followingIds])]
    : null;

  const prayers = userIds
    ? await listPrayerRequests({ viewerId: currentUser?.id, userIds, limit: 30 })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/60 bg-theme-surface-2/30">
        <p className="text-[12px] text-theme-muted">
          {t.home.followingPrayerSubtitle}
        </p>
        <Link
          href="/prayer/create"
          className="text-[12px] font-medium text-theme-primary hover:opacity-80"
        >
          {t.home.addPrayer}
        </Link>
      </div>

      {prayers.length === 0 ? (
        <div className="px-4 py-12 text-center space-y-3">
          <span className="text-4xl" aria-hidden>🙏</span>
          <p className="text-[15px] font-medium text-theme-text">기도 제목이 없습니다</p>
          <p className="text-[14px] text-theme-muted leading-relaxed">
            팔로우한 사람들이 올린 기도 제목이 여기 표시됩니다.
          </p>
          <Link
            href="/prayer"
            className="inline-block mt-2 text-[13px] text-theme-primary hover:opacity-80"
          >
            전체 기도 게시판 보기 →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {prayers.map((prayer) => {
            const initial = prayer.author?.name?.charAt(0) ?? "?";
            return (
              <Link key={prayer.id} href={`/prayer/${prayer.id}`} className="block px-4 py-4 hover:bg-theme-surface-2/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-theme-text">{prayer.author?.name ?? "알 수 없음"}</span>
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                        {PRAYER_CATEGORY_LABELS[prayer.category]}
                      </span>
                      {prayer.answeredAt && (
                        <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✓ 응답</span>
                      )}
                      <span className="text-[12px] text-theme-muted ml-auto">
                        {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">{prayer.content}</p>
                    <p className="text-[12px] text-theme-muted mt-1.5">🙏 {prayer.intercessorCount ?? 0}명이 기도했습니다</p>
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="px-4 py-3 text-center">
            <Link href="/prayer" className="text-[13px] text-theme-primary hover:opacity-80">
              전체 기도 게시판 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
