import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export default async function MeetingSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <p className="text-[11px] text-theme-muted uppercase tracking-wider">5단계 · 완료</p>
          <h1 className="text-xl font-semibold text-theme-text mt-1">📝 모임 요약</h1>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
            <p className="text-[12px] font-medium text-theme-muted mb-1">삶 나눔</p>
            <p className="text-[13px] text-theme-muted">기록이 없습니다</p>
          </div>
          <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
            <p className="text-[12px] font-medium text-theme-muted mb-1">설교 나눔</p>
            <p className="text-[13px] text-theme-muted">기록이 없습니다</p>
          </div>
          <div className="rounded-xl border border-theme-border bg-theme-surface p-4">
            <p className="text-[12px] font-medium text-theme-muted mb-1">기도제목</p>
            <p className="text-[13px] text-theme-muted">기록이 없습니다</p>
          </div>
        </div>
        <Link href={`/cells/${id}`} className="block w-full rounded-lg bg-theme-primary px-4 py-3 text-center text-[14px] font-medium text-white hover:opacity-90">
          모임 완료 · 셀로 돌아가기
        </Link>
      </div>
    </TimelineContainer>
  );
}
