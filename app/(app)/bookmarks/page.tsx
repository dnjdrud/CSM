import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { listBookmarks } from "@/lib/data/repository";
import { BookmarkedPostCard } from "./_components/BookmarkedPostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimelineContainer } from "@/components/TimelineContainer";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const posts = await listBookmarks(userId);

  return (
    <TimelineContainer>
      <div className="px-4 pt-5 pb-3 border-b border-theme-border">
        <div className="mb-3">
          <Link
            href="/feed"
            className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
          >
            ← Back to feed
          </Link>
        </div>
        <h1 className="text-[18px] font-semibold text-theme-text">Saved posts</h1>
        <p className="mt-1 text-[13px] text-theme-muted">
          {posts.length > 0 ? `${posts.length} post${posts.length === 1 ? "" : "s"} saved` : "No saved posts yet"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-6 px-4">
          <EmptyState
            title="No saved posts"
            description="Bookmark posts to read them later. Click the bookmark icon on any post."
          />
        </div>
      ) : (
        <ul className="list-none p-0 space-y-6 sm:space-y-5 py-4" role="list">
          {posts.map((post) => (
            <li key={post.id}>
              <BookmarkedPostCard post={post} currentUserId={userId} />
            </li>
          ))}
        </ul>
      )}
    </TimelineContainer>
  );
}
