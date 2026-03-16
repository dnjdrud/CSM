import Link from "next/link";
import { Suspense } from "react";
import { listFeedPostsPage, getCurrentUser, listFollowingIds, isBlocked, isMuted, getBookmarkedPostIds } from "@/lib/data/repository";
import { getSession } from "@/lib/auth/session";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { getAdminOrNull } from "@/lib/admin/guard";
import { TimelineContainer } from "@/components/TimelineContainer";
import { FlashBanner } from "@/components/FlashBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { scopeFromSearchParams } from "./_lib/scope";
import { FeedHeader } from "./_components/FeedHeader";
import { FeedComposer } from "./_components/FeedComposer";
import { FeedList } from "./_components/FeedList";
import { SuggestedPeople } from "./_components/SuggestedPeople";

export const dynamic = "force-dynamic";
const FEED_PAGE_SIZE = 20;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; message?: string }>;
}) {
  // Batch 1: user identity + search params (no data dependency between them)
  const [params, [session, currentUser]] = await Promise.all([
    searchParams,
    Promise.all([getSession(), getCurrentUser()]),
  ]);

  const scopeParam = scopeFromSearchParams(params);
  const showAdminRequiredBanner = params.message === "admin_required";

  // Batch 2: all data queries in parallel (adminContext, firstPage, followingIds)
  const [adminContext, firstPage, followingIds] = await Promise.all([
    getAdminOrNull(),
    listFeedPostsPage({
      currentUserId: currentUser?.id ?? null,
      scope: scopeParam,
      limit: FEED_PAGE_SIZE,
      cursor: null,
    }),
    currentUser ? listFollowingIds(currentUser.id) : Promise.resolve([]),
  ]);

  const bookmarkedPostIds = currentUser
    ? await getBookmarkedPostIds(currentUser.id, firstPage.items.map((p) => p.id))
    : [];

  const isAdmin = Boolean(adminContext);

  if (process.env.NODE_ENV !== "production" && (firstPage.error || firstPage.items.length === 0)) {
    console.log("[FeedPage]", { postCount: firstPage.items.length, feedError: firstPage.error });
  }

  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  const visibleItems =
    currentUser != null
      ? firstPage.items.filter((post) => {
          if (isBlocked(currentUser.id, post.authorId)) return false;
          if (isMuted(currentUser.id, post.authorId)) return false;
          return canViewPost(post, currentUser, isFollowing);
        })
      : firstPage.items;

  return (
    <TimelineContainer>
      <h1 className="sr-only">Feed</h1>
      {process.env.NODE_ENV !== "production" && (
        <div className="px-4 py-2 border-b border-theme-warning/30 bg-theme-warning-bg text-[13px] text-theme-warning" role="status" aria-label="Feed diagnostics">
          <p><strong>Session:</strong> userId={session?.userId ?? "—"} role={session?.role ?? "—"}</p>
          <p><strong>Posts from repository:</strong> {firstPage.items.length}{firstPage.error ? ` (error: ${firstPage.error})` : ""}</p>
        </div>
      )}
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
      {currentUser && followingIds.length === 0 && (
        <Suspense fallback={null}>
          <SuggestedPeople currentUserId={currentUser.id} role={currentUser.role} />
        </Suspense>
      )}
      <div className="space-y-6 sm:space-y-5 py-4">
        {firstPage.error ? (
          <div className="rounded-xl border border-theme-danger/20 bg-theme-danger-bg px-4 py-3 text-sm text-theme-danger">
            <p className="font-medium">Feed could not load.</p>
            <p className="mt-1">{firstPage.error}</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="No posts yet. Be the first to share."
            action={{ label: "Write a post", href: "/write" }}
          />
        ) : (
          <FeedList
            initialItems={visibleItems}
            initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
            scope={scopeParam}
            currentUserId={currentUser?.id ?? null}
            followingIds={followingIds}
            bookmarkedPostIds={bookmarkedPostIds}
          />
        )}
      </div>
      <p className="py-6 px-4 text-center border-t border-theme-border">
        <Link
          href="/search"
          className="text-xs text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
        >
          Search posts & people →
        </Link>
      </p>
    </TimelineContainer>
  );
}
