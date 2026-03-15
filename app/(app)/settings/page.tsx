import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { redirect } from "next/navigation";
import { LanguageSettingRow } from "@/components/layout/LanguageSettingRow";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "설정 – Cellah" };

export default async function SettingsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getServerT()]);
  if (!user) redirect("/login");

  const SETTINGS_ITEMS = [
    { href: "/settings/profile", icon: "👤", label: t.settings.profile, desc: t.settings.profileDesc },
    { href: "/settings/account", icon: "🔐", label: t.settings.account, desc: t.settings.accountDesc },
    { href: "/settings/notifications", icon: "🔔", label: t.settings.notificationsLabel, desc: t.settings.notificationsDesc },
    { href: "/bookmarks", icon: "🔖", label: t.settings.bookmarks, desc: t.settings.bookmarksDesc },
    { href: "/settings/candles", icon: "🕯️", label: "캔들 충전", desc: "캔들을 충전하고 크리에이터를 구독하세요" },
    { href: "/settings/creator", icon: "🐦", label: "크리에이터 설정", desc: "구독 가격 설정 및 구독자 관리" },
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
            <LanguageSettingRow />
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
            <p className="text-[12px] text-theme-muted">{t.settings.notificationsDesc}</p>
          </div>
          <span className="text-theme-muted shrink-0">›</span>
        </Link>

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-2/50 transition-colors"
          >
            <span className="text-xl shrink-0" aria-hidden>🛡️</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-theme-text">관리자 페이지</p>
              <p className="text-[12px] text-theme-muted">사용자 관리, 콘텐츠 관리</p>
            </div>
            <span className="text-theme-muted shrink-0">›</span>
          </Link>
        )}

        <Link
          href={`/profile/${user.id}`}
          className="block text-center text-[13px] text-theme-primary hover:opacity-80 py-1"
        >
          {t.profile.edit} →
        </Link>
      </div>
    </TimelineContainer>
  );
}
