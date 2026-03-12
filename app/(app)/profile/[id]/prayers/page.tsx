import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";

export default async function ProfilePrayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href={`/profile/${id}`} className="text-[12px] text-theme-muted hover:text-theme-primary">← 프로필</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">기도 제목</h1>
      </div>
      <ComingSoon
        title="기도 제목"
        description="이 멤버가 공개한 기도 제목을 확인하고 함께 기도할 수 있습니다."
        backHref={`/profile/${id}`}
        backLabel="프로필로"
        icon="🙏"
      />
    </TimelineContainer>
  );
}
