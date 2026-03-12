import { getCurrentUser } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { ProfileEditForm } from "@/app/(app)/profile/[id]/edit/_components/ProfileEditForm";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "프로필 수정 – Cellah" };

export default async function SettingsProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-4">
        <div>
          <Link href="/settings" className="text-[12px] text-theme-muted hover:text-theme-primary">← 설정</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">프로필 수정</h1>
        </div>
        <ProfileEditForm user={user} />
      </div>
    </TimelineContainer>
  );
}
