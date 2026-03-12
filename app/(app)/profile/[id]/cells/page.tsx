import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";

export default async function ProfileCellsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href={`/profile/${id}`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 프로필</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">참여 셀</h1>
      </div>
      <ComingSoon
        title="참여 셀 목록"
        description="이 멤버가 참여한 셀 목록을 확인할 수 있습니다."
        backHref={`/profile/${id}`}
        backLabel="프로필로"
        icon="👥"
      />
    </TimelineContainer>
  );
}
