import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";

export default async function TheologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
      </div>
      <ComingSoon
        title="신학 Q&A 상세"
        description="질문과 답변을 확인하고 토론에 참여하세요."
        backHref="/theology"
        backLabel="신학으로"
        icon="✝️"
      />
    </TimelineContainer>
  );
}
