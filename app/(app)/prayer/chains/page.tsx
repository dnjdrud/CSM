import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "기도 체인 – Cellah" };

export default function PrayerChainsPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">기도 체인</h1>
      </div>
      <ComingSoon
        title="기도 체인"
        description="24시간 끊이지 않는 릴레이 기도. 시간대별로 기도 순서를 맡아 함께 연속 기도합니다."
        backHref="/prayer"
        backLabel="기도 목록으로"
        icon="⛓️"
      />
    </TimelineContainer>
  );
}
