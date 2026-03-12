import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교 리포트 – Cellah" };

export default async function MissionaryReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">선교 리포트</h1>
      </div>
      <ComingSoon
        title="선교 리포트"
        description="현장 소식과 기도 제목을 후원자들에게 정기적으로 공유하세요."
        backHref="/missionary"
        backLabel="대시보드로"
        icon="📋"
      />
    </TimelineContainer>
  );
}
