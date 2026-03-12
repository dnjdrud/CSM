import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listPostsByAuthorId } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "애널리틱스 – Cellah" };

export default async function CreatorAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await listPostsByAuthorId(user.id);

  // Sort by total engagement
  const ranked = [...posts].sort((a, b) => {
    const aScore = (a.reactionCounts?.prayed ?? 0) + (a.reactionCounts?.withYou ?? 0) + (a.commentCount ?? 0);
    const bScore = (b.reactionCounts?.prayed ?? 0) + (b.reactionCounts?.withYou ?? 0) + (b.commentCount ?? 0);
    return bScore - aScore;
  });

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/creator" className="text-[12px] text-theme-muted hover:text-theme-primary">← 크리에이터</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">애널리틱스</h1>
        <p className="text-[12px] text-theme-muted mt-0.5">게시글별 반응 분석 (높은 순)</p>
      </div>

      {ranked.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-[14px]">게시글을 작성하면 분석 결과가 표시됩니다.</p>
          <Link href="/write" className="mt-3 inline-block text-sm text-theme-primary underline">글 작성하기</Link>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {ranked.map((post, idx) => {
            const total = (post.reactionCounts?.prayed ?? 0) + (post.reactionCounts?.withYou ?? 0) + (post.commentCount ?? 0);
            const best = ranked[0];
            const bestTotal = (best.reactionCounts?.prayed ?? 0) + (best.reactionCounts?.withYou ?? 0) + (best.commentCount ?? 0);
            const pct = bestTotal > 0 ? Math.round((total / bestTotal) * 100) : 0;

            return (
              <Link key={post.id} href={`/post/${post.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-[13px] font-bold text-theme-muted w-5 shrink-0 mt-0.5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[post.category]}
                      </span>
                      <span className="text-[11px] text-theme-muted">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[13px] text-theme-text line-clamp-2 leading-relaxed">{post.content}</p>
                    {/* Engagement bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-theme-border overflow-hidden">
                      <div className="h-full bg-theme-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[12px] text-theme-muted">
                      <span>🙏 {post.reactionCounts?.prayed ?? 0}</span>
                      <span>🤝 {post.reactionCounts?.withYou ?? 0}</span>
                      <span>💬 {post.commentCount ?? 0}</span>
                      <span className="ml-auto font-medium text-theme-text">총 {total}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </TimelineContainer>
  );
}
