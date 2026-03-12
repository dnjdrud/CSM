import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "교회 – Cellah" };

export default function NetworkChurchesPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">교회</h1>
      </div>
      <ComingSoon
        title="교회 디렉토리"
        description="Cellah에 등록된 교회를 탐색하고 연결하세요."
        backHref="/network"
        backLabel="네트워크로"
        icon="⛪"
      />
    </TimelineContainer>
  );
}
