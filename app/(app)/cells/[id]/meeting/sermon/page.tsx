import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export default async function MeetingSermonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-4">
        <div>
          <Link href={`/cells/${id}/meeting/life`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 삶 나눔</Link>
          <p className="text-[11px] text-theme-muted uppercase tracking-wider mt-2">2단계</p>
          <h1 className="text-xl font-semibold text-theme-text">📖 설교 나눔</h1>
          <p className="text-[13px] text-theme-muted mt-0.5">지난 주일 말씀을 함께 묵상해요</p>
        </div>
        <input className="w-full rounded-xl border border-theme-border bg-theme-surface p-4 text-[14px] text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30" placeholder="본문 말씀 (예: 마태복음 5:1-12)" />
        <textarea className="w-full rounded-xl border border-theme-border bg-theme-surface p-4 text-[14px] text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30 resize-none min-h-[120px]" placeholder="말씀에서 은혜 받은 내용을 나눠보세요…" />
        <Link href={`/cells/${id}/meeting/prayer`} className="block w-full rounded-lg bg-theme-primary px-4 py-3 text-center text-[14px] font-medium text-white hover:opacity-90">
          다음: 기도제목 나눔 →
        </Link>
      </div>
    </TimelineContainer>
  );
}
