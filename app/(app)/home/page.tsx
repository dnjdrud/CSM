import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser, listFeedPostsPage, listFollowingIds, isBlocked, isMuted, getBookmarkedPostIds, getTodaysDailyPrayer } from "@/lib/data/repository";
import { getSession } from "@/lib/auth/session";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { TimelineContainer } from "@/components/TimelineContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedList } from "@/app/(app)/feed/_components/FeedList";
import { FeedComposer } from "@/app/(app)/feed/_components/FeedComposer";
import { SuggestedPeople } from "@/app/(app)/feed/_components/SuggestedPeople";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "홈 – Cellah",
};

const FEED_PAGE_SIZE = 20;

function getTodayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default async function HomePage() {
  const [session, currentUser] = await Promise.all([getSession(), getCurrentUser()]);

  const [dailyPrayer, firstPage, followingIds] = await Promise.all([
    getTodaysDailyPrayer(),
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: "FOLLOWING",
      limit: FEED_PAGE_SIZE,
      cursor: null,
    }),
    currentUser ? listFollowingIds(currentUser.id) : Promise.resolve([]),
  ]);

  const bookmarkedPostIds = currentUser
    ? await getBookmarkedPostIds(currentUser.id, firstPage.items.map((p) => p.id))
    : [];

  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, isFollowing);
      })
    : firstPage.items;

  return (
    <TimelineContainer>
      <h1 className="sr-only">홈</h1>

      {/* Daily Prayer Banner */}
      <div className="border-b border-theme-border/60 bg-gradient-to-b from-theme-surface-2/40 to-transparent px-4 py-4">
        <p className="text-[11px] font-medium text-theme-muted uppercase tracking-wider mb-2">
          {getTodayLabel()}
        </p>
        {dailyPrayer ? (
          <Link
            href={`/post/${dailyPrayer.id}`}
            className="block group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden>🙏</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-theme-text group-hover:text-theme-primary transition-colors">
                  오늘의 기도
                </p>
                <p className="text-[14px] text-theme-text leading-relaxed line-clamp-3 mt-0.5">
                  {dailyPrayer.content}
                </p>
                <p className="text-[12px] text-theme-primary mt-1.5 font-medium">
                  함께 기도하기 →
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0" aria-hidden>🙏</span>
            <p className="text-[14px] text-theme-muted">
              오늘의 기도가 아직 준비되지 않았습니다.
            </p>
          </div>
        )}
      </div>

      {/* Feed Composer */}
      {currentUser && <FeedComposer />}

      {/* Suggested People (when no following) */}
      {currentUser && followingIds.length === 0 && (
        <Suspense fallback={null}>
          <SuggestedPeople currentUserId={currentUser.id} role={currentUser.role} />
        </Suspense>
      )}

      {/* Following Feed */}
      <div className="py-2">
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-[12px] font-medium text-theme-muted uppercase tracking-wider">
            팔로우 피드
          </p>
          <Link href="/feed?scope=ALL" className="text-[12px] text-theme-primary hover:opacity-80">
            전체 보기
          </Link>
        </div>

        {firstPage.error ? (
          <div className="mx-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            피드를 불러올 수 없습니다. {firstPage.error}
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="아직 게시글이 없습니다"
            description="팔로우한 사람들의 글이 여기 표시됩니다."
            action={{ label: "탐색하기", href: "/explore" }}
          />
        ) : (
          <FeedList
            initialItems={visibleItems}
            initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
            scope="FOLLOWING"
            currentUserId={currentUser?.id ?? null}
            followingIds={followingIds}
            bookmarkedPostIds={bookmarkedPostIds}
            isAdmin={false}
          />
        )}
      </div>
    </TimelineContainer>
  );
}
