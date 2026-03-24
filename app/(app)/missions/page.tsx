import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listMissionaryProjects } from "@/lib/data/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교 프로젝트 – Cellah" };

export default async function MissionsPage() {
  const user = await getCurrentUser();
  const missions = await listMissionaryProjects({ viewerId: user?.id ?? null });

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-theme-text">선교 프로젝트</h1>
            {user?.role === "MISSIONARY" && (
              <Link href="/missionary/project/create" className="text-[13px] text-theme-primary hover:underline">
                + 프로젝트 등록
              </Link>
            )}
          </div>
          <nav className="flex gap-4 mt-3 text-[13px]">
            <span className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">전체</span>
            {user?.role === "MISSIONARY" && <Link href="/missionary" className="text-theme-muted hover:text-theme-text">내 대시보드</Link>}
          </nav>
        </div>

        {missions.length === 0 ? (
          <div className="py-16 text-center text-theme-muted">
            <p className="text-4xl mb-3">🌍</p>
            <p className="text-[14px]">등록된 선교 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {missions.map((mission) => (
              <Link key={mission.id} href={`/missions/${mission.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg shrink-0">
                    🌍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-theme-text text-[14px]">{mission.title}</p>
                        <p className="text-[12px] text-theme-muted mt-0.5">
                          {mission.missionary?.name} · {mission.country} · {mission.field}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                        진행중
                      </span>
                    </div>
                    {mission.description && (
                      <p className="text-[13px] text-theme-muted mt-2 line-clamp-2 leading-relaxed">{mission.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[12px] text-theme-muted">
                      <span>🙏 기도 후원 {mission.supporterCount ?? 0}명</span>
                      {mission.hasPrayerSupport && <span className="text-theme-primary">• 내가 후원 중</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
