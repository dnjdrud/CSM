import { TimelineContainer } from "@/components/TimelineContainer";
import { ComingSoon } from "@/components/ui/ComingSoon";
export const dynamic = "force-dynamic";
export default async function CellMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimelineContainer><ComingSoon title="셀 멤버" description="셀에 참여한 멤버 목록을 볼 수 있습니다." backHref={`/cells/${id}`} backLabel="채팅으로 돌아가기" icon="👥" /></TimelineContainer>;
}
