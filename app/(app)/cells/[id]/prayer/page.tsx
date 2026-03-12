import { TimelineContainer } from "@/components/TimelineContainer";
import { ComingSoon } from "@/components/ui/ComingSoon";
export const dynamic = "force-dynamic";
export default async function CellPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimelineContainer><ComingSoon title="셀 기도제목" description="함께 나누는 기도제목 목록입니다." backHref={`/cells/${id}`} backLabel="채팅으로 돌아가기" icon="🙏" /></TimelineContainer>;
}
