import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export default async function MeetingLifePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-4">
        <div>
          <Link href={`/cells/${id}/meeting/start`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 모임 순서</Link>
          <p className="text-[11px] text-theme-muted uppercase tracking-wider mt-2">1단계</p>
          <h1 className="text-xl font-semibold text-theme-text">💭 삶 나눔</h1>
          <p className="text-[13px] text-theme-muted mt-0.5">한 주 동안의 이야기를 나눠요</p>
        </div>
        <textarea className="w-full rounded-xl border border-theme-border bg-theme-surface p-4 text-[14px] text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30 resize-none min-h-[120px]" placeholder="이번 주 삶에서 나누고 싶은 이야기를 적어보세요…" />
        <Link href={`/cells/${id}/meeting/sermon`} className="block w-full rounded-lg bg-theme-primary px-4 py-3 text-center text-[14px] font-medium text-white hover:opacity-90">
          다음: 설교 나눔 →
        </Link>
      </div>
    </TimelineContainer>
  );
}
