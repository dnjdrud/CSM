import { TimelineContainer } from "@/components/TimelineContainer";
import { ComingSoon } from "@/components/ui/ComingSoon";
export const dynamic = "force-dynamic";
export default async function CellPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimelineContainer><ComingSoon title="셀 게시판" description="셀 전용 게시판에서 글을 나눠보세요." backHref={`/cells/${id}`} backLabel="채팅으로 돌아가기" icon="📋" /></TimelineContainer>;
}
