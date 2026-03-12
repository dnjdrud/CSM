import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "후원자 관리 – Cellah" };

export default async function MissionarySupportersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">후원자</h1>
      </div>
      <ComingSoon
        title="후원자 관리"
        description="기도와 재정으로 후원하는 분들의 목록을 확인하고 감사를 전하세요."
        backHref="/missionary"
        backLabel="대시보드로"
        icon="🙌"
      />
    </TimelineContainer>
  );
}
