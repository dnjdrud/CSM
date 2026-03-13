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

export function Header({ user, initialUnreadCount = 0 }: HeaderProps) {
  const t = useT();
  const isAdmin = user?.isAdmin === true;
  const [unreadCount, setUnreadCount] = useState(user ? initialUnreadCount : 0);
  const lastCountRef = useRef(unreadCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (!user) {
      setUnreadCount(0);
      lastCountRef.current = 0;
      return;
    }
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

  // Close menu on outside click
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

  const displayCount = user ? unreadCount : 0;
  const iconBtn = "p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1";

  return (
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
              {/* Direct Messages */}
              <Link href="/messages" className={iconBtn} aria-label="다이렉트 메시지">
                <SendIcon className="w-5 h-5" />
              </Link>

              {/* Write */}
              <Link
                href="/write"
                className={iconBtn}
                aria-label={t.header.write}
              >
                <PencilIcon className="w-5 h-5" />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className={`${iconBtn} relative`}
                aria-label={displayCount > 0 ? `${t.header.notifications} ${displayCount}` : t.header.notifications}
              >
                <BellIcon className="w-5 h-5" />
                {displayCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tabular-nums leading-4">
                    {displayCount > 9 ? "9+" : displayCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
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

                    <Link
                      href={`/profile/${user.id}`}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors"
                    >
                      {t.header.profile}
                    </Link>

                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors"
                    >
                      {t.header.settings}
                    </Link>

                    <Link
                      href="/guide"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors"
                    >
                      {t.header.guide}
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] text-theme-text hover:bg-theme-surface-2 transition-colors"
                      >
                        {t.header.admin}
                      </Link>
                    )}

                    <div className="border-t border-theme-border/60 mt-1 pt-1">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          role="menuitem"
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-theme-surface-2 transition-colors"
                        >
                          {t.header.logout}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
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
  );
}
