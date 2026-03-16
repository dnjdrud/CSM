"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";
import { CellahLogo } from "@/components/CellahLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export type HeaderUser = { id: string; name: string; isAdmin: boolean; role?: string } | null;

const POLL_INTERVAL_MS = 10 * 1000;
const UNREAD_COUNT_API = "/api/notifications/unread-count";
const EVENT_READ_ALL = "csm:notifications-read-all";
const EVENT_NOTIFICATION_NEW = "csm:notification-new";
const EVENT_NOTIFICATION_READ = "csm:notification-read";

type HeaderProps = {
  user: HeaderUser;
  initialUnreadCount?: number;
};

/* ── Icons ───────────────────────────────────────────────────────────────── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ── Header ──────────────────────────────────────────────────────────────── */

export function Header({ user, initialUnreadCount = 0 }: HeaderProps) {
  const t = useT();
  const isAdmin = user?.isAdmin === true;
  const [unreadCount, setUnreadCount] = useState(user ? initialUnreadCount : 0);
  const lastCountRef = useRef(unreadCount);

  // Desktop dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Notification polling ── */

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(UNREAD_COUNT_API);
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.charAt(0) !== "{" && trimmed.charAt(0) !== "[") return;
      const data = JSON.parse(text) as { count?: number };
      const count = typeof data?.count === "number" ? data.count : 0;
      if (count !== lastCountRef.current) {
        lastCountRef.current = count;
        setUnreadCount(count);
      }
    } catch {
      // keep current count on error
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); lastCountRef.current = 0; return; }
    setUnreadCount(initialUnreadCount);
    lastCountRef.current = initialUnreadCount;
  }, [user, initialUnreadCount]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchCount]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => void fetchCount();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, fetchCount]);

  useEffect(() => {
    const onReadAll = () => { lastCountRef.current = 0; setUnreadCount(0); };
    const onNew = () => { lastCountRef.current += 1; setUnreadCount((c) => c + 1); };
    const onRead = () => { lastCountRef.current = Math.max(0, lastCountRef.current - 1); setUnreadCount((c) => Math.max(0, c - 1)); };
    window.addEventListener(EVENT_READ_ALL, onReadAll);
    window.addEventListener(EVENT_NOTIFICATION_NEW, onNew);
    window.addEventListener(EVENT_NOTIFICATION_READ, onRead);
    return () => {
      window.removeEventListener(EVENT_READ_ALL, onReadAll);
      window.removeEventListener(EVENT_NOTIFICATION_NEW, onNew);
      window.removeEventListener(EVENT_NOTIFICATION_READ, onRead);
    };
  }, []);

  /* ── Desktop dropdown close on outside click ── */
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  /* ── Mobile drawer: close on Escape + lock body scroll ── */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const displayCount = user ? unreadCount : 0;
  const iconBtn = "p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1";

  return (
    <>
      <header className="border-b border-theme-border/60 bg-theme-surface sticky top-0 z-20 shrink-0" role="banner">
        <div className="flex items-center justify-between gap-2 px-4 h-12 max-w-[100vw]">
          {/* Logo */}
          <Link href="/home" aria-label="Cellah 홈으로">
            <CellahLogo className="text-[17px] shrink-0" />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />

            <Link href="/search" className={iconBtn} aria-label={t.common.search}>
              <SearchIcon className="w-5 h-5" />
            </Link>

            {user && (
              <>
                {/* DM — 데스크톱에서만 표시 */}
                <Link href="/messages" className={`${iconBtn} hidden md:flex`} aria-label="다이렉트 메시지">
                  <SendIcon className="w-5 h-5" />
                </Link>

                {/* 글쓰기 — 데스크톱에서만 표시 */}
                <Link href="/write" className={`${iconBtn} hidden md:flex`} aria-label={t.header.write}>
                  <PencilIcon className="w-5 h-5" />
                </Link>

                {/* 알림 — 항상 표시 (배지 중요) */}
                <Link
                  href="/notifications"
                  className={`${iconBtn} relative`}
                  aria-label={displayCount > 0 ? `${t.header.notifications} ${displayCount}` : t.header.notifications}
                >
                  <BellIcon className="w-5 h-5" />
                  {displayCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-theme-danger px-1 text-[10px] font-bold text-white tabular-nums leading-4">
                      {displayCount > 9 ? "9+" : displayCount}
                    </span>
                  )}
                </Link>

                {/* 유저 메뉴 드롭다운 — 데스크톱에서만 표시 */}
                <div className="relative hidden md:block" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className={`${iconBtn} flex items-center gap-1.5`}
                    aria-label={t.header.settings}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-theme-border bg-theme-surface shadow-lg py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-theme-border/60">
                        <p className="text-[13px] font-medium text-theme-text truncate">{user.name}</p>
                      </div>
                      <Link href={`/profile/${user.id}`} role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors">
                        {t.header.profile}
                      </Link>
                      <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors">
                        {t.header.settings}
                      </Link>
                      <Link href="/guide" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors">
                        {t.header.guide}
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors">
                          {t.header.admin}
                        </Link>
                      )}
                      <div className="border-t border-theme-border/60 mt-1 pt-1">
                        <form action={logoutAction}>
                          <button type="submit" role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 text-[13px] text-theme-danger hover:bg-theme-surface-2 transition-colors">
                            {t.header.logout}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

                {/* 햄버거 — 모바일에서만 표시 */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={`${iconBtn} md:hidden`}
                  aria-label="메뉴 열기"
                  aria-expanded={drawerOpen}
                  aria-haspopup="dialog"
                >
                  <MenuIcon className="w-5 h-5" />
                </button>
              </>
            )}

            {!user && (
              <Link href="/login" className="rounded-lg bg-theme-primary px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1">
                {t.header.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── 모바일 사이드 드로어 ─────────────────────────────────────────────
          - 배경 오버레이: 클릭하면 닫힘
          - 패널: 오른쪽에서 슬라이드 인
      ──────────────────────────────────────────────────────────────────── */}
      {user && (
        <>
          {/* 배경 오버레이 */}
          <div
            className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden ${
              drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />

          {/* 드로어 패널 */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="메뉴"
            className={`fixed top-0 right-0 z-40 h-full w-72 bg-theme-surface shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
              drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-theme-border/60 shrink-0">
              <div>
                <p className="text-[14px] font-semibold text-theme-text leading-tight">{user.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface-2 transition-colors"
                aria-label="메뉴 닫기"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 메뉴 항목 */}
            <nav className="flex-1 overflow-y-auto py-2">
              <DrawerLink href={`/profile/${user.id}`} onClick={() => setDrawerOpen(false)}>
                <UserCircleIcon className="w-5 h-5 shrink-0" />
                {t.header.profile}
              </DrawerLink>

              <DrawerLink href="/messages" onClick={() => setDrawerOpen(false)}>
                <SendIcon className="w-5 h-5 shrink-0" />
                다이렉트 메시지
              </DrawerLink>

              <DrawerLink href="/write" onClick={() => setDrawerOpen(false)}>
                <PencilIcon className="w-5 h-5 shrink-0" />
                {/* t.header.write에 ✏️ 이모지가 포함되어 있어 드로어에서는 제거 후 표시 */}
                {t.header.write.replace(/^\p{Emoji}\s*/u, "")}
              </DrawerLink>

              <div className="my-2 border-t border-theme-border/60" />

              <DrawerLink href="/settings" onClick={() => setDrawerOpen(false)}>
                <SettingsIcon className="w-5 h-5 shrink-0" />
                {t.header.settings}
              </DrawerLink>

              <DrawerLink href="/guide" onClick={() => setDrawerOpen(false)}>
                <BookIcon className="w-5 h-5 shrink-0" />
                {t.header.guide}
              </DrawerLink>

              {isAdmin && (
                <DrawerLink href="/admin" onClick={() => setDrawerOpen(false)}>
                  <ShieldIcon className="w-5 h-5 shrink-0" />
                  {t.header.admin}
                </DrawerLink>
              )}
            </nav>

            {/* 로그아웃 */}
            <div className="border-t border-theme-border/60 p-3 shrink-0">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] text-theme-danger hover:bg-theme-danger-bg transition-colors"
                >
                  <LogoutIcon className="w-5 h-5 shrink-0" />
                  {t.header.logout}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── 드로어 링크 공통 컴포넌트 ───────────────────────────────────────────── */

function DrawerLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 text-[14px] text-theme-text hover:bg-theme-surface-2 transition-colors"
    >
      {children}
    </Link>
  );
}

/* ── 드로어 전용 아이콘 ───────────────────────────────────────────────────── */

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
