import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata = { title: "신학 주제 – Cellah" };

export default function TheologyTopicsPage() {
  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">주제별 탐색</h1>
      </div>
      <ComingSoon
        title="신학 주제"
        description="구원론, 종말론, 교회론 등 다양한 신학 주제를 탐색하세요."
        backHref="/theology"
        backLabel="신학으로"
        icon="📚"
      />
    </TimelineContainer>
  );
}
