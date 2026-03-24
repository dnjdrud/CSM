import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
  getMissionaryProjectById,
  listMissionaryReports,
  listMissionarySupporters,
} from "@/lib/data/repository";
import { toggleSupportAction, submitReportAction } from "@/app/(app)/missionary/actions";

export const dynamic = "force-dynamic";

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [mission, reports, supporters] = await Promise.all([
    getMissionaryProjectById(id, user?.id ?? null),
    listMissionaryReports(id),
    listMissionarySupporters(id),
  ]);

  if (!mission) notFound();

  const isOwner = user?.id === mission.missionaryId;

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <Link href="/missions" className="text-[12px] text-theme-muted hover:text-theme-primary">← 선교 프로젝트</Link>
        </div>

        {/* Mission info */}
        <div className="px-4 py-5 border-b border-theme-border space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-theme-text">{mission.title}</h1>
              <p className="text-[13px] text-theme-muted mt-0.5">
                {mission.missionary?.name} · {mission.country} · {mission.field}
              </p>
            </div>
            <span className="shrink-0 text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              진행중
            </span>
          </div>

          {mission.description && (
            <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap">{mission.description}</p>
          )}

          {/* Support action */}
          {user && !isOwner && (
            <form action={toggleSupportAction}>
              <input type="hidden" name="projectId" value={mission.id} />
              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                  mission.hasPrayerSupport
                    ? "border border-theme-border text-theme-muted hover:bg-theme-surface-2"
                    : "bg-theme-primary text-white hover:opacity-90"
                }`}
              >
                {mission.hasPrayerSupport ? "🙏 기도 후원 중 (취소하기)" : "🙏 기도로 후원하기"}
              </button>
            </form>
          )}

          <p className="text-[13px] text-theme-muted">기도 후원자 {mission.supporterCount ?? 0}명</p>
        </div>

        {/* Reports */}
        <div className="px-4 py-4 border-b border-theme-border space-y-4">
          <p className="text-[14px] font-semibold text-theme-text">현장 소식</p>

          {isOwner && (
            <form action={submitReportAction} className="space-y-2">
              <input type="hidden" name="projectId" value={mission.id} />
              <textarea
                name="content"
                rows={3}
                minLength={10}
                required
                placeholder="현지 소식과 기도 제목을 나눠주세요."
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-[13px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
              <button type="submit" className="px-4 py-2 bg-theme-primary text-white rounded-lg text-[13px] font-medium hover:opacity-90">
                소식 등록
              </button>
            </form>
          )}

          {reports.length === 0 ? (
            <p className="text-[13px] text-theme-muted py-4 text-center">아직 등록된 현장 소식이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl bg-theme-surface border border-theme-border px-4 py-3">
                  <p className="text-[12px] text-theme-muted mb-1">{new Date(report.createdAt).toLocaleDateString("ko-KR")}</p>
                  <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap">{report.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supporters */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-[14px] font-semibold text-theme-text">기도 후원자 ({supporters.length})</p>
          {supporters.length === 0 ? (
            <p className="text-[13px] text-theme-muted">아직 기도 후원자가 없습니다. 첫 번째 후원자가 되어주세요!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {supporters.map((s) => (
                <Link key={s.id} href={`/profile/${s.userId}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-theme-border hover:bg-theme-surface text-[13px] text-theme-text">
                  <span className="w-5 h-5 rounded-full bg-theme-primary/20 text-theme-primary text-[11px] flex items-center justify-center font-medium">
                    {s.user?.name?.charAt(0) ?? "?"}
                  </span>
                  {s.user?.name ?? "알 수 없음"}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </TimelineContainer>
  );
}
