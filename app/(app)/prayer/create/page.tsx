import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrayerCreateForm } from "./_components/PrayerCreateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "기도 요청하기 – Cellah" };

export default async function PrayerCreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">기도 요청하기</h1>
        </div>
        <PrayerCreateForm />
      </div>
    </TimelineContainer>
  );
}
