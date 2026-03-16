import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
export default async function MeetingPrayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6 text-center">
        <div>
          <Link href={`/cells/${id}/meeting/sermon`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 설교 나눔</Link>
          <p className="text-[11px] text-theme-muted uppercase tracking-wider mt-2">4단계</p>
          <h1 className="text-xl font-semibold text-theme-text mt-1">✝️ 함께 기도</h1>
        </div>
        <div className="py-8">
          <p className="text-5xl mb-4">🙏</p>
          <p className="text-[16px] font-medium text-theme-text">나눈 기도제목으로 함께 기도하세요</p>
          <p className="text-[13px] text-theme-muted mt-2 leading-relaxed">기도가 끝나면 아래 버튼을 눌러 모임을 마무리해요</p>
        </div>
        <Link href={`/cells/${id}/meeting/summary`} className="block w-full rounded-lg bg-theme-primary px-4 py-3 text-center text-[14px] font-medium text-white hover:opacity-90">
          기도 마침 · 요약 →
        </Link>
      </div>
    </TimelineContainer>
  );
}
