import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/missions" className="text-[12px] text-theme-muted hover:text-theme-primary">← 선교</Link>
      </div>
      <ComingSoon
        title="선교 상세 페이지"
        description="선교사 소식, 기도 제목, 후원 정보를 확인할 수 있습니다."
        backHref="/missions"
        backLabel="선교 목록으로"
        icon="🌍"
      />
    </TimelineContainer>
  );
}
