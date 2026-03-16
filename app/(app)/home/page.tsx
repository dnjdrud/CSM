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
import type { Translations } from "@/lib/i18n/translations";

// force-dynamic 유지 이유:
//   홈 피드는 로그인 사용자별 완전 개인화 콘텐츠 (팔로우, 역할, 북마크 등) 이므로
//   정적/ISR 캐시가 불가능하다. revalidate=0도 동일 효과이지만,
//   force-dynamic이 의도를 더 명시적으로 표현한다.
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

/* ── Skeleton fallbacks ─────────────────────────────────────────────────────
   데이터 없이도 즉시 스트리밍되는 경량 HTML.
   실제 콘텐츠가 준비될 때까지 레이아웃 이동 없이 공간을 점유한다.
──────────────────────────────────────────────────────────────────────────── */

function FeedSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-theme-border/60">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="px-4 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-theme-surface-2" />
            <div className="h-3 w-24 rounded bg-theme-surface-2" />
          </div>
          <div className="h-3 w-full rounded bg-theme-surface-2" />
          <div className="h-3 w-3/4 rounded bg-theme-surface-2" />
        </div>
      ))}
    </div>
  );
}

function PrayerSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-theme-border/60">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="px-4 py-4 flex gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-surface-2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-theme-surface-2" />
            <div className="h-3 w-full rounded bg-theme-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyPrayerBannerSkeleton() {
  return (
    <div className="border-b border-theme-border/60 bg-gradient-to-b from-theme-surface-2/40 to-transparent px-4 py-4">
      <div className="animate-pulse space-y-2">
        <div className="h-2 w-28 rounded bg-theme-surface-2" />
        <div className="h-4 w-3/4 rounded bg-theme-surface-2" />
        <div className="h-3 w-1/2 rounded bg-theme-surface-2" />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────
   최적화 핵심:
   - getCurrentUser()를 await하지 않고 Promise로 전달한다.
   - 페이지 함수 자체가 즉시 반환되어 TimelineContainer + HomeTabs 셸이
     데이터 완료를 기다리지 않고 즉시 스트리밍된다.
   - 탭 컨텐츠는 각자의 Suspense 경계 안에서 데이터를 기다린다.
──────────────────────────────────────────────────────────────────────────── */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const activeTab: HomeTab = params.tab === "prayer" ? "prayer" : "feed";
  const rawScope = params.scope === "following" ? "FOLLOWING" : "ALL";
  const uiScope: "all" | "following" = rawScope === "FOLLOWING" ? "following" : "all";

  // await 없이 Promise 생성 — 탭 컴포넌트 안에서 Suspense 경계 내부에 resolve됨.
  // 이렇게 하면 페이지 셸(탭바 포함)이 DB 조회 전에 먼저 스트리밍된다.
  const currentUserPromise = getCurrentUser();

  return (
    <TimelineContainer>
      <h1 className="sr-only">홈</h1>

      <Suspense fallback={<div className="h-12 border-b border-theme-border" />}>
        <HomeTabs activeTab={activeTab} />
      </Suspense>

      {activeTab === "feed" ? (
        // Suspense로 감싸야 FeedTabContent가 데이터를 기다리는 동안
        // 위의 탭바가 이미 화면에 표시된다. (스트리밍)
        <Suspense fallback={<FeedSkeleton />}>
          <FeedTabContent currentUserPromise={currentUserPromise} scope={rawScope} uiScope={uiScope} />
        </Suspense>
      ) : (
        <Suspense fallback={<PrayerSkeleton />}>
          <PrayerTabContent currentUserPromise={currentUserPromise} />
        </Suspense>
      )}
    </TimelineContainer>
  );
}

/* ── Feed Tab ───────────────────────────────────────────────────────────────
   최적화 내역:
   1. dailyPrayerPromise를 다른 await보다 먼저 시작해 병렬 실행 보장.
      → DailyPrayerBanner를 별도 Suspense로 분리하여 피드 목록과 독립 스트리밍.
   2. currentUser + getServerT 병렬 대기.
   3. listFeedPostsPage + listFollowingIds 병렬 실행 (기존과 동일).
   4. getBookmarkedPostIds는 firstPage post ID가 필요해 직렬 불가피.
      근본 해결은 listFeedPostsPage 내부에서 bookmarked 플래그를 포함시키는 것.
   5. followingIds → Set 변환으로 isFollowingFn 조회를 O(n) → O(1)로 개선.
──────────────────────────────────────────────────────────────────────────── */

async function FeedTabContent({
  currentUserPromise,
  scope,
  uiScope,
}: {
  currentUserPromise: ReturnType<typeof getCurrentUser>;
  scope: "ALL" | "FOLLOWING";
  uiScope: "all" | "following";
}) {
  // DailyPrayerBanner 데이터 fetch를 가장 먼저 시작.
  // 이 Promise는 아래 await들과 병렬로 실행된다.
  // 피드 데이터보다 느리면 배너만 별도로 늦게 스트리밍되고, 피드는 먼저 표시된다.
  const dailyPrayerPromise = getTodaysDailyPrayer();

  // currentUser resolve와 i18n 로드를 병렬 처리
  const [currentUser, t] = await Promise.all([
    currentUserPromise,
    getServerT(),
  ]);

  // 피드 첫 페이지와 팔로우 목록을 병렬 실행
  const [firstPage, followingIds] = await Promise.all([
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope,
      limit: FEED_PAGE_SIZE,
      cursor: null,
      includeCategories: HOME_FEED_CATEGORIES,
    }),
    currentUser ? listFollowingIds(currentUser.id) : Promise.resolve([]),
  ]);

  // getBookmarkedPostIds는 firstPage의 post ID가 있어야 실행 가능 — 직렬 불가피.
  // TODO: listFeedPostsPage에 bookmarked 플래그를 포함시키면 이 호출을 제거할 수 있다.
  const bookmarkedPostIds = currentUser
    ? await getBookmarkedPostIds(
        currentUser.id,
        firstPage.items.map((p) => p.id)
      )
    : [];

  // Array.includes() O(n) → Set.has() O(1)
  const followingSet = new Set(followingIds);
  const isFollowingFn = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingSet.has(followingId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, isFollowingFn);
      })
    : firstPage.items;

  return (
    <div>
      <FeedScopeToggle initialScope={uiScope} context="home" />
      {/*
        DailyPrayerBanner를 별도 Suspense 경계로 분리.
        dailyPrayerPromise는 이미 위에서 시작됐으므로 피드 쿼리와 병렬 실행 중이다.
        - 배너 쿼리가 피드보다 빠르면 → 피드와 함께 즉시 렌더
        - 배너 쿼리가 피드보다 느리면 → 피드 먼저 표시, 배너 나중에 스트리밍
        어느 쪽이든 피드 렌더가 배너를 기다리지 않는다.
      */}
      <Suspense fallback={<DailyPrayerBannerSkeleton />}>
        <DailyPrayerBannerServer dataPromise={dailyPrayerPromise} />
      </Suspense>

      {currentUser && (
        <div className="border-b border-theme-border/60 px-4 py-3 space-y-2">
          <p className="text-[12px] text-theme-muted">
            {getRoleUX(currentUser.role).homeCta}
          </p>
          <FeedComposer />
        </div>
      )}

      {/*
        SuggestedPeople: followingIds가 없을 때만 표시.
        이미 Suspense 안에 있어 초기 렌더를 막지 않는다.
      */}
      {currentUser && followingIds.length === 0 && (
        <Suspense fallback={null}>
          <SuggestedPeople currentUserId={currentUser.id} role={currentUser.role} />
        </Suspense>
      )}

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-xl border border-theme-danger/20 bg-theme-danger-bg px-4 py-3 text-sm text-theme-danger">
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
          scope={scope}
        />
      )}
    </div>
  );
}

/* ── Daily Prayer Banner ────────────────────────────────────────────────────
   DailyPrayerBannerServer: 외부에서 시작된 Promise를 받아 대기.
   자체 Suspense 경계 안에서만 suspend되므로 피드 목록 렌더를 블록하지 않는다.
──────────────────────────────────────────────────────────────────────────── */

async function DailyPrayerBannerServer({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getTodaysDailyPrayer>;
}) {
  // 세 fetch를 병렬 대기 (cookies()는 Next.js 요청 내 메모이즈됨)
  const [dailyPrayer, t, locale] = await Promise.all([
    dataPromise,
    getServerT(),
    getServerLocale(),
  ]);
  return <DailyPrayerBanner dailyPrayer={dailyPrayer} t={t} locale={locale} />;
}

function DailyPrayerBanner({
  dailyPrayer,
  t,
  locale,
}: {
  dailyPrayer: { id: string; content: string } | null;
  t: Translations;
  locale: string;
}) {
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

/* ── Prayer Tab ─────────────────────────────────────────────────────────────
   최적화 내역:
   - currentUser + getServerT 병렬 대기.
   - listFollowingIds → listPrayerRequests는 구조적으로 직렬 불가피:
     listPrayerRequests의 userIds 인자가 followingIds에 의존하기 때문.
     근본 해결: follows JOIN을 포함한 단일 DB 쿼리 함수 추가 필요.
   - 전체 컴포넌트가 Suspense 안에 있어 페이지 셸은 이미 스트리밍된 상태.
──────────────────────────────────────────────────────────────────────────── */

async function PrayerTabContent({
  currentUserPromise,
}: {
  currentUserPromise: ReturnType<typeof getCurrentUser>;
}) {
  const [currentUser, t] = await Promise.all([
    currentUserPromise,
    getServerT(),
  ]);

  // followingIds는 listPrayerRequests의 userIds를 만들기 위해 먼저 필요 — 직렬 불가피
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
              <Link
                key={prayer.id}
                href={`/prayer/${prayer.id}`}
                className="block px-4 py-4 hover:bg-theme-surface-2/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-theme-text">
                        {prayer.author?.name ?? "알 수 없음"}
                      </span>
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                        {PRAYER_CATEGORY_LABELS[prayer.category]}
                      </span>
                      {prayer.answeredAt && (
                        <span className="text-[11px] bg-theme-success-bg text-theme-success px-2 py-0.5 rounded-full">
                          ✓ 응답
                        </span>
                      )}
                      <span className="text-[12px] text-theme-muted ml-auto">
                        {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">
                      {prayer.content}
                    </p>
                    <p className="text-[12px] text-theme-muted mt-1.5">
                      🙏 {prayer.intercessorCount ?? 0}명이 기도했습니다
                    </p>
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
