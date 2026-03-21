import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getCurrentUser,
  listFeedPostsPage,
} from "@/lib/data/repository";
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
const CANDIDATE_SIZE = PAGE_SIZE * 3;

export default async function ContentsPage() {
  const currentUser = await getCurrentUser();

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
  const items = firstPage.items;

  const signals: UserSignals = {
    interestTags: new Map(interestTags.map((t) => [t.tag, t.weight])),
    likedPostIds: new Set(
      interactions.filter((i) => i.interactionType === "like").map((i) => i.postId)
    ),
    bookmarkedAuthorIds: new Set(
      interactions
        .filter((i) => i.interactionType === "bookmark")
        .map((i) => items.find((p) => p.id === i.postId)?.authorId)
        .filter((id): id is string => !!id)
    ),
    watchedAuthorIds: new Set(
      interactions
        .filter((i) => i.interactionType === "view" && (i.watchTimeSeconds ?? 0) > 60)
        .map((i) => items.find((p) => p.id === i.postId)?.authorId)
        .filter((id): id is string => !!id)
    ),
    subscribedCreatorIds: new Set(subscribedCreatorIds),
  };

  const rankedItems = currentUser
    ? rankPosts(items, signals).slice(0, PAGE_SIZE)
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
            currentUserId={currentUser?.id ?? null}
            subscribedCreatorIds={subscribedCreatorIds}
          />
        </div>
      )}
    </TimelineContainer>
  );
}
