import { Suspense } from "react";
import Link from "next/link";
import { listFeedPostsPage, getCurrentUser, listFollowingIds, isBlocked, isMuted, getPinnedPost } from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { getAdminOrNull } from "@/lib/admin/guard";
import { TimelineContainer } from "@/components/TimelineContainer";
import { FlashBanner } from "@/components/FlashBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { scopeFromSearchParams } from "./_lib/scope";
import { FeedHeader } from "./_components/FeedHeader";
import { FeedComposer } from "./_components/FeedComposer";
import { FeedPinnedPost } from "./_components/FeedPinnedPost";
import { FeedList } from "./_components/FeedList";

const FEED_PAGE_SIZE = 20;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; message?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const scopeParam = scopeFromSearchParams(params);
  const showAdminRequiredBanner = params.message === "admin_required";
  const adminContext = await getAdminOrNull();
  const isAdmin = Boolean(adminContext);

  const [pinnedPost, firstPage] = await Promise.all([
    getPinnedPost(currentUser?.id ?? null),
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: scopeParam,
      limit: FEED_PAGE_SIZE,
      cursor: null,
    }),
  ]);

  const followingIds = currentUser ? await listFollowingIds(currentUser.id) : [];
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId) || isMuted(currentUser.id, post.authorId))
          return false;
        return canViewPost(post, currentUser, isFollowing);
      })
    : [];

  const showPinned =
    pinnedPost &&
    currentUser &&
    (() => {
      if (isBlocked(currentUser.id, pinnedPost.authorId) || isMuted(currentUser.id, pinnedPost.authorId))
        return false;
      return canViewPost(pinnedPost, currentUser, isFollowing);
    })();

  return (
    <TimelineContainer>
      <h1 className="sr-only">Feed</h1>
      {showAdminRequiredBanner && (
        <div className="px-4 pt-4 pb-2">
          <FlashBanner
            title="Admin access required"
            body="This area is only available to admin accounts."
            optional="If you believe this is a mistake, contact an admin."
          />
        </div>
      )}
      <FeedHeader
        initialScope={scopeParam === "FOLLOWING" ? "following" : "all"}
        isAdmin={isAdmin}
      />
      {currentUser && <FeedComposer />}
      <div className="space-y-6 sm:space-y-5 py-4">
        {showPinned && pinnedPost && (
          <ul className="list-none p-0" role="list">
            <FeedPinnedPost
              pinnedPost={pinnedPost}
              currentUserId={currentUser?.id ?? null}
            />
          </ul>
        )}
        {visibleItems.length === 0 && !showPinned ? (
          <EmptyState
            title="Nothing here yet"
            description="This space is quiet for now. Share a prayer or reflection when you're ready."
            action={{ label: "Write a post", href: "/write" }}
          />
        ) : (
          <FeedList
            initialItems={visibleItems}
            initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
            scope={scopeParam}
            currentUserId={currentUser?.id ?? null}
          />
        )}
      </div>
      <p className="py-6 px-4 text-center border-t border-gray-200">
        <Link
          href="/search"
          className="text-xs text-neutral-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          Search posts & people →
        </Link>
      </p>
    </TimelineContainer>
  );
}
