import { Suspense } from "react";
import Link from "next/link";
import { listFeedPostsPage, getCurrentUser, listFollowingIds, isBlocked, isMuted } from "@/lib/data/repository";
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

export const dynamic = "force-dynamic";
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

  const firstPage = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: scopeParam,
    limit: FEED_PAGE_SIZE,
    cursor: null,
  });

  const diagnostics = {
    userId: currentUser?.id ?? null,
    role: currentUser?.role ?? null,
    postCount: firstPage.items.length,
    feedError: firstPage.error ?? null,
  };
  if (process.env.NODE_ENV !== "production") {
    console.log("[FeedPage]", diagnostics);
  }

  const followingIds = currentUser ? await listFollowingIds(currentUser.id) : [];
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser?.id && followingIds.includes(followingId);

  let filteredByBlock = 0;
  let filteredByMute = 0;
  let filteredByCanView = 0;
  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) {
          filteredByBlock++;
          return false;
        }
        if (isMuted(currentUser.id, post.authorId)) {
          filteredByMute++;
          return false;
        }
        if (!canViewPost(post, currentUser, isFollowing)) {
          filteredByCanView++;
          return false;
        }
        return true;
      })
    : [];

  if (process.env.NODE_ENV !== "production" && (filteredByBlock > 0 || filteredByMute > 0 || filteredByCanView > 0)) {
    console.log("[FeedPage] filtered", { filteredByBlock, filteredByMute, filteredByCanView, visibleCount: visibleItems.length });
  }

  return (
    <TimelineContainer>
      <h1 className="sr-only">Feed</h1>
      <div className="px-4 py-2 border-b border-amber-200 bg-amber-50/80 text-[13px] text-amber-900" role="status" aria-label="Feed diagnostics">
        <p><strong>Session:</strong> userId={diagnostics.userId ?? "—"} role={String(diagnostics.role ?? "—")}</p>
        <p><strong>Posts from repository:</strong> {diagnostics.postCount}</p>
        {diagnostics.postCount === 0 && !diagnostics.feedError && (
          <p className="mt-1 text-amber-800">Feed empty (check logs).</p>
        )}
        {diagnostics.feedError && (
          <p className="mt-1 font-medium text-red-700"><strong>Feed query error:</strong> {diagnostics.feedError}</p>
        )}
      </div>
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
        {diagnostics.feedError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-medium">Feed could not load.</p>
            <p className="mt-1">{diagnostics.feedError}</p>
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
