import { TimelineContainer } from "@/components/TimelineContainer";
import { listFeedPostsPage } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import { encodeCursor } from "@/lib/domain/pagination";
import { listMySubscriptions } from "@/lib/data/subscriptionRepository";
import { getUserInteractions, getUserInterestTags } from "@/lib/data/supabaseRepository";
import { rankPosts, buildUserSignals } from "@/lib/recommendation/scorer";
import { ContentsInfiniteList } from "./_components/ContentsInfiniteList";
import { ContentsBottomSearchBar } from "./_components/ContentsBottomSearchBar";
import { IconFeather } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "컨텐츠 – Cellah" };

const PAGE_SIZE = 20;
const CANDIDATE_SIZE = PAGE_SIZE * 2;

export default async function ContentsPage() {
  // getAuthUserId reads the JWT from the cookie (~1ms, no DB roundtrip).
  // The full user profile isn't needed here — only the ID drives all downstream queries.
  const currentUserId = await getAuthUserId();

  const [firstPage, mySubscriptions, interactions, interestTags] = await Promise.all([
    listFeedPostsPage({
      currentUserId,
      scope: "ALL",
      limit: CANDIDATE_SIZE,
      cursor: null,
      requireYoutubeUrl: true,
    }),
    currentUserId ? listMySubscriptions(currentUserId) : Promise.resolve([]),
    currentUserId ? getUserInteractions(currentUserId, 100) : Promise.resolve([]),
    currentUserId ? getUserInterestTags(currentUserId) : Promise.resolve([]),
  ]);

  const subscribedCreatorIds = mySubscriptions.map((s) => s.creatorId);
  const items = firstPage.items;

  const rankedItems = currentUserId
    ? rankPosts(
        items,
        buildUserSignals(items, interactions, interestTags, subscribedCreatorIds)
      ).slice(0, PAGE_SIZE)
    : items.slice(0, PAGE_SIZE);

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
          <IconFeather className="h-6 w-6 text-theme-muted" aria-hidden />
        </div>
      </header>

      <ContentsBottomSearchBar position="top" />

      {firstPage.error ? (
        <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          콘텐츠를 불러올 수 없습니다. {firstPage.error}
        </div>
      ) : (
        <div>
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
            initialItems={rankedItems}
            initialNextCursorStr={
              firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null
            }
            currentUserId={currentUserId}
            subscribedCreatorIds={subscribedCreatorIds}
          />
        </div>
      )}
    </TimelineContainer>
  );
}
