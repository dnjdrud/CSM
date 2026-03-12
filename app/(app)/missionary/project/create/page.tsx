import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교 프로젝트 등록 – Cellah" };

export default async function MissionaryProjectCreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">프로젝트 등록</h1>
      </div>
      <ComingSoon
        title="선교 프로젝트 등록"
        description="새 선교 프로젝트를 등록하고 후원자와 기도 파트너를 모집하세요."
        backHref="/missionary"
        backLabel="대시보드로"
        icon="✈️"
      />
    </TimelineContainer>
  );
}
