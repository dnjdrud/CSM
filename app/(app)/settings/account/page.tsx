import { getCurrentUser } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { DeleteAccountSection } from "@/app/(app)/profile/[id]/_components/DeleteAccountSection";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "계정 관리 – Cellah" };

export default async function SettingsAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isDeactivated = Boolean(user.deactivatedAt);
  const canRestore = isDeactivated && user.deactivatedAt
    ? Date.now() - new Date(user.deactivatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/settings" className="text-[12px] text-theme-muted hover:text-theme-primary">← 설정</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">계정 관리</h1>
        </div>

        {/* Account info */}
        <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
          <div className="px-4 py-3">
            <p className="text-[12px] text-theme-muted">이름</p>
            <p className="text-[14px] text-theme-text mt-0.5">{user.name}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[12px] text-theme-muted">역할</p>
            <p className="text-[14px] text-theme-text mt-0.5">{user.role}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[12px] text-theme-muted">가입일</p>
            <p className="text-[14px] text-theme-text mt-0.5">
              {new Date(user.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text hover:bg-theme-surface-2 text-left"
          >
            로그아웃
          </button>
        </form>

        {/* Danger zone */}
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-red-600 uppercase tracking-wider">위험 구역</p>
          <DeleteAccountSection isDeactivated={isDeactivated} canRestore={canRestore} />
        </div>
      </div>
    </TimelineContainer>
  );
}
