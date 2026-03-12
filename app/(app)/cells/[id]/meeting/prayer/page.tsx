import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export default async function MeetingPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-4">
        <div>
          <Link href={`/cells/${id}/meeting/sermon`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 설교 나눔</Link>
          <p className="text-[11px] text-theme-muted uppercase tracking-wider mt-2">3단계</p>
          <h1 className="text-xl font-semibold text-theme-text">🙏 기도제목 나눔</h1>
          <p className="text-[13px] text-theme-muted mt-0.5">서로의 기도제목을 나눠요</p>
        </div>
        <textarea className="w-full rounded-xl border border-theme-border bg-theme-surface p-4 text-[14px] text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30 resize-none min-h-[120px]" placeholder="나눌 기도제목을 적어보세요…" />
        <Link href={`/cells/${id}/meeting/pray`} className="block w-full rounded-lg bg-theme-primary px-4 py-3 text-center text-[14px] font-medium text-white hover:opacity-90">
          다음: 함께 기도 →
        </Link>
      </div>
    </TimelineContainer>
  );
}
