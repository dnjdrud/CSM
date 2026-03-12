import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listMissionaryProjects, listMissionaryReports } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { submitReportAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교 리포트 – Cellah" };

export default async function MissionaryReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myProjects = await listMissionaryProjects({ missionaryId: user.id });

  const reportsByProject = await Promise.all(
    myProjects.map(async (project) => ({
      project,
      reports: await listMissionaryReports(project.id),
    }))
  );

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">선교 리포트</h1>
        </div>

        {myProjects.length === 0 ? (
          <div className="py-12 text-center text-theme-muted">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-[14px]">등록된 선교 프로젝트가 없습니다.</p>
            <Link href="/missionary/project/create" className="mt-3 inline-block text-sm text-theme-primary underline">
              프로젝트 등록하기
            </Link>
          </div>
        ) : (
          reportsByProject.map(({ project, reports }) => (
            <div key={project.id} className="space-y-3">
              <Link href={`/missions/${project.id}`} className="font-medium text-theme-text hover:underline block">
                {project.title}
              </Link>

              {/* New report form */}
              <form action={submitReportAction} className="space-y-2">
                <input type="hidden" name="projectId" value={project.id} />
                <textarea
                  name="content"
                  rows={3}
                  minLength={10}
                  required
                  placeholder="현지 소식과 기도 제목을 후원자들에게 공유하세요."
                  className="w-full rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-[13px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                />
                <button type="submit" className="px-4 py-2 bg-theme-primary text-white rounded-lg text-[13px] font-medium hover:opacity-90">
                  소식 등록
                </button>
              </form>

              {reports.length === 0 ? (
                <p className="text-[13px] text-theme-muted">아직 등록된 소식이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-xl bg-theme-surface border border-theme-border px-4 py-3">
                      <p className="text-[12px] text-theme-muted mb-1">{new Date(report.createdAt).toLocaleDateString("ko-KR")}</p>
                      <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap">{report.content}</p>
                    </div>
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
