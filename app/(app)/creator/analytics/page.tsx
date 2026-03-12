import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "애널리틱스 – Cellah" };

export default async function CreatorAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/creator" className="text-[12px] text-theme-muted hover:text-theme-primary">← 크리에이터</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">애널리틱스</h1>
      </div>
      <ComingSoon
        title="콘텐츠 애널리틱스"
        description="조회수, 참여율, 팔로워 성장 추이를 상세하게 분석하세요."
        backHref="/creator"
        backLabel="크리에이터 홈"
        icon="📈"
      />
    </TimelineContainer>
  );
}
