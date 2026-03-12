import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listMissionaryProjects, listMissionarySupporters } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "후원자 – Cellah" };

export default async function MissionarySupportersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myProjects = await listMissionaryProjects({ missionaryId: user.id });

  // Fetch supporters for all my projects
  const supportersByProject = await Promise.all(
    myProjects.map(async (project) => ({
      project,
      supporters: await listMissionarySupporters(project.id),
    }))
  );

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">후원자</h1>
        </div>

        {myProjects.length === 0 ? (
          <div className="py-12 text-center text-theme-muted">
            <p className="text-4xl mb-3">🙌</p>
            <p className="text-[14px]">등록된 선교 프로젝트가 없습니다.</p>
            <Link href="/missionary/project/create" className="mt-3 inline-block text-sm text-theme-primary underline">
              프로젝트 등록하기
            </Link>
          </div>
        ) : (
          supportersByProject.map(({ project, supporters }) => (
            <div key={project.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Link href={`/missions/${project.id}`} className="font-medium text-theme-text hover:underline">
                  {project.title}
                </Link>
                <span className="text-[12px] text-theme-muted">{supporters.length}명</span>
              </div>

              {supporters.length === 0 ? (
                <p className="text-[13px] text-theme-muted px-1">아직 기도 후원자가 없습니다.</p>
              ) : (
                <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
                  {supporters.map((s) => (
                    <Link key={s.id} href={`/profile/${s.userId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-theme-surface-2 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-sm font-semibold shrink-0">
                        {s.user?.name?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-theme-text">{s.user?.name ?? "알 수 없음"}</p>
                        <p className="text-[12px] text-theme-muted">{s.user?.affiliation ?? s.user?.role ?? ""}</p>
                      </div>
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full shrink-0">
                        🙏 기도
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </TimelineContainer>
  );
}
