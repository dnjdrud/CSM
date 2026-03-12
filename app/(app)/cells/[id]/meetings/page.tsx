import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export const dynamic = "force-dynamic";
export default async function CellMeetingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-theme-text">셀 모임</h1>
          <Link href={`/cells/${id}/meeting/start`} className="rounded-lg bg-theme-primary px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            모임 시작
          </Link>
        </div>
        <p className="text-[14px] text-theme-muted">모임 기록이 여기에 표시됩니다.</p>
        <div className="space-y-2">
          {[{ date: "2026.03.10", title: "3월 10일 정기 모임" }, { date: "2026.03.03", title: "3월 3일 정기 모임" }].map((m) => (
            <div key={m.date} className="rounded-xl border border-theme-border bg-theme-surface p-4">
              <p className="text-[12px] text-theme-muted">{m.date}</p>
              <p className="text-[14px] font-medium text-theme-text mt-0.5">{m.title}</p>
              <p className="text-[12px] text-theme-muted mt-1">요약 · 기도제목 3개</p>
            </div>
          ))}
        </div>
        <Link href={`/cells/${id}`} className="text-[13px] text-theme-muted hover:text-theme-primary">← 채팅으로</Link>
      </div>
    </TimelineContainer>
  );
}
