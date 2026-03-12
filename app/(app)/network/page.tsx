import { TimelineContainer } from "@/components/TimelineContainer";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "네트워크 – Cellah" };

export default function NetworkPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <h1 className="text-xl font-semibold text-theme-text">네트워크</h1>
      </div>
      <ComingSoon
        title="네트워크"
        description="교회, 선교단체, 셀 네트워크를 탐색하고 연결하세요."
        icon="🕸️"
      />
    </TimelineContainer>
  );
}
