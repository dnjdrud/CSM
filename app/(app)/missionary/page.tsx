import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listMissionaryProjects, listMissionaryReports } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교사 대시보드 – Cellah" };

export default async function MissionaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myProjects = await listMissionaryProjects({ missionaryId: user.id });

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-theme-text">선교사 대시보드</h1>
          <Link href="/missionary/project/create" className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90">
            + 프로젝트 등록
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/missionary/supporters", icon: "🙌", label: "후원자" },
            { href: "/missionary/reports",    icon: "📋", label: "리포트" },
            { href: "/missions",              icon: "🌍", label: "전체 선교" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center rounded-xl border border-theme-border bg-theme-surface py-4 gap-1 hover:bg-theme-surface-2 transition-colors">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[12px] text-theme-muted">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* My projects */}
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-theme-muted uppercase tracking-wider">내 프로젝트</p>

          {myProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-theme-border px-4 py-8 text-center">
              <p className="text-[14px] text-theme-muted mb-3">아직 등록된 선교 프로젝트가 없습니다.</p>
              <Link href="/missionary/project/create" className="text-sm text-theme-primary underline">
                첫 프로젝트 등록하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.map((project) => (
                <Link key={project.id} href={`/missions/${project.id}`} className="block rounded-xl border border-theme-border bg-theme-surface px-4 py-4 hover:bg-theme-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-theme-text">{project.title}</p>
                      <p className="text-[12px] text-theme-muted mt-0.5">{project.country} · {project.field}</p>
                    </div>
                    <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">진행중</span>
                  </div>
                  <p className="text-[12px] text-theme-muted mt-2">기도 후원자 {project.supporterCount ?? 0}명</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </TimelineContainer>
  );
}
