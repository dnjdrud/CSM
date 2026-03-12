import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "추천 네트워크 – Cellah" };

export default function NetworkSuggestedPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">추천</h1>
      </div>
      <ComingSoon
        title="추천 네트워크"
        description="관심사와 지역을 기반으로 추천된 교회, 셀, 선교단체를 탐색하세요."
        backHref="/network"
        backLabel="네트워크로"
        icon="✨"
      />
    </TimelineContainer>
  );
}
