import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "설정 – Cellah" };

const SETTINGS_ITEMS = [
  { href: "/settings/profile", icon: "👤", label: "프로필 수정", desc: "이름, 소개, 사진 변경" },
  { href: "/settings/account", icon: "🔐", label: "계정 관리", desc: "이메일, 계정 삭제" },
  { href: "/settings/notifications", icon: "🔔", label: "알림 설정", desc: "알림 종류 및 빈도 설정" },
  { href: "/bookmarks", icon: "🔖", label: "저장한 게시글", desc: "북마크한 게시글 모아보기" },
] as const;

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-semibold text-theme-text">설정</h1>

        {/* Profile summary */}
        <Link
          href="/settings/profile"
          className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface p-4 hover:border-theme-primary/40 transition-colors"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="md" className="h-12 w-12 text-base shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-theme-text text-[15px] truncate">{user.name}</p>
            <p className="text-[13px] text-theme-muted">{ROLE_DISPLAY[user.role]}</p>
          </div>
          <span className="text-theme-muted shrink-0">›</span>
        </Link>

        {/* Settings list */}
        <nav>
          <ul className="divide-y divide-theme-border/60 rounded-xl border border-theme-border bg-theme-surface overflow-hidden">
            {SETTINGS_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-2/50 transition-colors"
                >
                  <span className="text-xl shrink-0" aria-hidden>{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-theme-text">{item.label}</p>
                    <p className="text-[12px] text-theme-muted">{item.desc}</p>
                  </div>
                  <span className="text-theme-muted shrink-0">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* My Space link */}
        <Link
          href="/me"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-2/50 transition-colors"
        >
          <span className="text-xl shrink-0" aria-hidden>📓</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-theme-text">My Space</p>
            <p className="text-[12px] text-theme-muted">기도노트, 묵상 일기</p>
          </div>
          <span className="text-theme-muted shrink-0">›</span>
        </Link>

        {/* Profile link */}
        <Link
          href={`/profile/${user.id}`}
          className="block text-center text-[13px] text-theme-primary hover:opacity-80 py-1"
        >
          내 프로필 보기 →
        </Link>
      </div>
    </TimelineContainer>
  );
}
