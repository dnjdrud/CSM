import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 기도 – Cellah" };

export default async function MyPrayerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">내 기도</h1>
      </div>
      <ComingSoon
        title="내 기도 모아보기"
        description="내가 요청한 기도와 응답된 기도를 한눈에 볼 수 있습니다."
        backHref="/prayer"
        backLabel="기도 목록으로"
        icon="📖"
      />
    </TimelineContainer>
  );
}
