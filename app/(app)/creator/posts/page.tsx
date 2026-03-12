import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 콘텐츠 – Cellah" };

export default async function CreatorPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/creator" className="text-[12px] text-theme-muted hover:text-theme-primary">← 크리에이터</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">내 콘텐츠</h1>
      </div>
      <ComingSoon
        title="콘텐츠 관리"
        description="작성한 모든 게시물을 관리하고 성과를 확인하세요."
        backHref="/creator"
        backLabel="크리에이터 홈"
        icon="📝"
      />
    </TimelineContainer>
  );
}
