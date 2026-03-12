import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const dynamic = "force-dynamic";
export const metadata = { title: "크리에이터 – Cellah" };

export default async function CreatorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <h1 className="text-xl font-semibold text-theme-text">크리에이터</h1>
      </div>
      <ComingSoon
        title="크리에이터 홈"
        description="콘텐츠를 만들고 커뮤니티와 나누세요. 설교, 묵상, 강의를 통해 영향력을 키우세요."
        icon="🎙️"
      />
    </TimelineContainer>
  );
}
