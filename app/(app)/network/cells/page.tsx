import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "셀 네트워크 – Cellah" };

export default function NetworkCellsPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">셀 네트워크</h1>
      </div>
      <ComingSoon
        title="셀 네트워크"
        description="다른 교회와 지역의 셀 소그룹과 연결하고 교류하세요."
        backHref="/network"
        backLabel="네트워크로"
        icon="🔗"
      />
    </TimelineContainer>
  );
}
