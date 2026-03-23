import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { redirect } from "next/navigation";
import { LanguageSettingRow } from "@/components/layout/LanguageSettingRow";
import { getServerT } from "@/lib/i18n/server";
import { logoutAction } from "@/app/actions/auth";
import { IconChevronRight, IconFeather, IconMessageCircle } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "설정 – Cellah" };

export default async function SettingsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getServerT()]);
  if (!user) redirect("/login");

  const SETTINGS_ITEMS = [
    { href: "/settings/profile", Icon: IconUserCircle, label: t.settings.profile, desc: t.settings.profileDesc },
    { href: "/settings/account", Icon: IconShieldLock, label: t.settings.account, desc: t.settings.accountDesc },
    { href: "/settings/notifications", Icon: IconBell, label: t.settings.notificationsLabel, desc: t.settings.notificationsDesc },
    { href: "/bookmarks", Icon: IconBookmark, label: t.settings.bookmarks, desc: t.settings.bookmarksDesc },
    { href: "/settings/candles", Icon: IconCandle, label: "캔들 충전", desc: "캔들을 충전하고 크리에이터를 구독하세요" },
    { href: "/settings/creator", Icon: IconFeather, label: "크리에이터 설정", desc: "구독 가격 설정 및 구독자 관리" },
  ] as const;

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-semibold text-theme-text">{t.settings.title}</h1>

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
          <IconChevronRight className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
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
                  <item.Icon className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-theme-text">{item.label}</p>
                    <p className="text-[12px] text-theme-muted">{item.desc}</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
            <LanguageSettingRow />
            <li>
              <Link
                href="/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-2/50 transition-colors"
              >
                <IconMessageCircle className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-theme-text">이용방법</p>
                  <p className="text-[12px] text-theme-muted">기능 소개와 사용 가이드를 확인하세요</p>
                </div>
                <IconChevronRight className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
              </Link>
            </li>
            <li>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-2/50 transition-colors text-left"
                >
                  <IconLogout className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-theme-text">로그아웃</p>
                    <p className="text-[12px] text-theme-muted">계정에서 로그아웃합니다</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
                </button>
              </form>
            </li>
          </ul>
        </nav>

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-2/50 transition-colors"
          >
            <IconShieldLock className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-theme-text">관리자 페이지</p>
              <p className="text-[12px] text-theme-muted">사용자 관리, 콘텐츠 관리</p>
            </div>
            <IconChevronRight className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
          </Link>
        )}

      </div>
    </TimelineContainer>
  );
}

function IconUserCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function IconShieldLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <rect x="9" y="11" width="6" height="6" rx="1" />
      <path d="M10 11V9.5a2 2 0 0 1 4 0V11" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconCandle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2c2 2 2 4 0 6-2-2-2-4 0-6z" />
      <path d="M10 10h4" />
      <path d="M9 10v10a3 3 0 0 0 6 0V10" />
      <path d="M8 22h8" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
