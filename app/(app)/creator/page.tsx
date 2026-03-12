import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCreatorStats } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "크리에이터 – Cellah" };

export default async function CreatorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getCreatorStats(user.id);

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        {/* Profile summary */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-theme-text text-lg">{user.name}</p>
            <p className="text-[13px] text-theme-muted">{user.affiliation ?? user.role}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "게시글", value: stats.postCount },
            { label: "기도해요", value: stats.totalPrayed },
            { label: "함께해요", value: stats.totalWithYou },
            { label: "댓글", value: stats.totalComments },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-theme-border bg-theme-surface px-4 py-4 text-center">
              <p className="text-2xl font-bold text-theme-text">{s.value.toLocaleString()}</p>
              <p className="text-[12px] text-theme-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          {[
            { href: "/creator/posts",     icon: "📝", label: "내 콘텐츠",      desc: "작성한 게시글 관리" },
            { href: "/creator/analytics", icon: "📈", label: "애널리틱스",     desc: "게시글별 반응 분석" },
            { href: "/creator/dashboard", icon: "📊", label: "대시보드",       desc: "전체 통계 한눈에 보기" },
            { href: "/write",             icon: "✏️",  label: "새 글 작성",    desc: "새 콘텐츠 만들기" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 hover:bg-theme-surface-2 transition-colors">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-[14px] font-medium text-theme-text">{item.label}</p>
                <p className="text-[12px] text-theme-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </TimelineContainer>
  );
}
