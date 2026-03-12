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
            href="/home"
            className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded"
          >
            ← 홈으로
          </Link>
        </div>
        <h1 className="text-[18px] font-semibold text-theme-text">저장한 글</h1>
        <p className="mt-1 text-[13px] text-theme-muted">
          {posts.length > 0 ? `${posts.length}개 저장됨` : "저장된 글이 없습니다"}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-6 px-4">
          <EmptyState
            title="저장된 글이 없습니다"
            description="북마크 아이콘을 눌러 나중에 읽고 싶은 글을 저장해보세요."
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
