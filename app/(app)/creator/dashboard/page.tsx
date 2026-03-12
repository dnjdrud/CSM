import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCreatorStats, listPostsByAuthorId, listFollowerIds, listFollowingIds } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "크리에이터 대시보드 – Cellah" };

export default async function CreatorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, posts, followerIds, followingIds] = await Promise.all([
    getCreatorStats(user.id),
    listPostsByAuthorId(user.id),
    listFollowerIds(user.id),
    listFollowingIds(user.id),
  ]);

  const totalReactions = stats.totalPrayed + stats.totalWithYou;
  const engagementRate = stats.postCount > 0
    ? Math.round((totalReactions + stats.totalComments) / stats.postCount * 10) / 10
    : 0;

  const recentPosts = posts.slice(0, 5);

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/creator" className="text-[12px] text-theme-muted hover:text-theme-primary">← 크리에이터</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">대시보드</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "팔로워", value: followerIds.length },
            { label: "팔로잉", value: followingIds.length },
            { label: "게시글", value: stats.postCount },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-theme-border bg-theme-surface px-3 py-4 text-center">
              <p className="text-xl font-bold text-theme-text">{s.value}</p>
              <p className="text-[11px] text-theme-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Engagement */}
        <div className="rounded-xl border border-theme-border bg-theme-surface px-4 py-4 space-y-3">
          <p className="text-[13px] font-medium text-theme-text">전체 반응</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: "기도해요", value: stats.totalPrayed },
              { label: "함께해요", value: stats.totalWithYou },
              { label: "댓글", value: stats.totalComments },
              { label: "글당 평균", value: engagementRate },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold text-theme-text">{s.value}</p>
                <p className="text-[10px] text-theme-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        {recentPosts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-theme-text">최근 게시글</p>
              <Link href="/creator/posts" className="text-[12px] text-theme-primary">전체 보기</Link>
            </div>
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 hover:bg-theme-surface-2 transition-colors">
                  <p className="text-[13px] text-theme-text line-clamp-1 flex-1">{post.content}</p>
                  <div className="flex items-center gap-3 text-[12px] text-theme-muted shrink-0">
                    <span>🙏 {post.reactionCounts?.prayed ?? 0}</span>
                    <span>💬 {post.commentCount ?? 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
