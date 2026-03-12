import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교사 대시보드 – Cellah" };

export default async function MissionaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <h1 className="text-xl font-semibold text-theme-text">선교사 대시보드</h1>
      </div>
      <ComingSoon
        title="선교사 대시보드"
        description="선교 현황, 후원자 관리, 기도 리포트를 작성하고 공유할 수 있습니다."
        icon="✈️"
      />
    </TimelineContainer>
  );
}
