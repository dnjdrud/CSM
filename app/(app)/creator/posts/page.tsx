import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listPostsByAuthorId } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 콘텐츠 – Cellah" };

export default async function CreatorPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await listPostsByAuthorId(user.id);

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/creator" className="text-[12px] text-theme-muted hover:text-theme-primary">← 크리에이터</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-semibold text-theme-text">내 콘텐츠</h1>
          <Link href="/write" className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90">
            + 새 글
          </Link>
        </div>
        <p className="text-[12px] text-theme-muted mt-0.5">총 {posts.length}개</p>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-[14px]">아직 작성한 게시글이 없습니다.</p>
          <Link href="/write" className="mt-3 inline-block text-sm text-theme-primary underline">첫 글 작성하기</Link>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {posts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <span className="text-[11px] text-theme-muted">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[12px] text-theme-muted">
                <span>🙏 {post.reactionCounts?.prayed ?? 0}</span>
                <span>🤝 {post.reactionCounts?.withYou ?? 0}</span>
                <span>💬 {post.commentCount ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
