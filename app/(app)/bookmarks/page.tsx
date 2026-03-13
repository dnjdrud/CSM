import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { listBookmarks } from "@/lib/data/repository";
import { BookmarkedPostCard } from "./_components/BookmarkedPostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const t = await getServerT();
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const posts = await listBookmarks(userId);

  return (
    <TimelineContainer>
      <div className="px-4 pt-5 pb-3 border-b border-theme-border">
        <div className="mb-3">
          <Link
            href="/home"
            className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
          >
            {t.common.backHome}
          </Link>
        </div>
        <h1 className="text-[18px] font-semibold text-theme-text">{t.bookmarks.title}</h1>
        <p className="mt-1 text-[13px] text-theme-muted">
          {posts.length > 0 ? `${posts.length}${t.bookmarks.savedCount}` : t.bookmarks.empty}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-6 px-4">
          <EmptyState
            title={t.bookmarks.empty}
            description={t.bookmarks.emptyDesc}
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
