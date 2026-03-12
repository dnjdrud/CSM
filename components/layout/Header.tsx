"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";
import { CellahLogo } from "@/components/CellahLogo";

export type HeaderUser = { id: string; name: string; isAdmin: boolean; role?: string } | null;

const POLL_INTERVAL_MS = 10 * 1000;
const UNREAD_COUNT_API = "/api/notifications/unread-count";
const EVENT_READ_ALL = "csm:notifications-read-all";
const EVENT_NOTIFICATION_NEW = "csm:notification-new";
const EVENT_NOTIFICATION_READ = "csm:notification-read";

type HeaderProps = {
  user: HeaderUser;
  /** Initial unread count from server; updated by polling and read-all event. */
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

/** Single top bar for all screen sizes. */
export function Header({ user, initialUnreadCount = 0 }: HeaderProps) {
  const isAdmin = user?.isAdmin === true;
  const [unreadCount, setUnreadCount] = useState(user ? initialUnreadCount : 0);
  const lastCountRef = useRef(unreadCount);

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

  const displayCount = user ? unreadCount : 0;

  return (
    <header className="border-b border-theme-border/60 bg-theme-surface sticky top-0 z-20 shrink-0" role="banner">
      <div className="flex items-center justify-between gap-2 px-4 py-3 max-w-[100vw]">
        <Link href="/home" aria-label="Cellah 홈으로">
          <CellahLogo className="text-[17px] shrink-0" />
        </Link>
        <nav className="flex items-center gap-2 flex-wrap justify-end" aria-label="Main navigation">
          <Link href="/search" className="p-1.5 text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="검색">
            <SearchIcon className="w-5 h-5" />
          </Link>
          {user && (
            <>
              <Link
                href="/write"
                className="inline-flex items-center gap-1 rounded-lg bg-theme-primary px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
              >
                ✏️ 글쓰기
              </Link>
              <Link
                href="/messages"
                className="p-1.5 text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
                aria-label="메시지"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Link>
              <Link
                href="/notifications"
                className="relative p-1.5 text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
                aria-label={displayCount > 0 ? `알림 ${displayCount}개` : "알림"}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {displayCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {displayCount > 9 ? "9+" : displayCount}
                  </span>
                )}
              </Link>
            </>
          )}
          {user ? (
            <>
              {process.env.NODE_ENV !== "production" && (
                <span className="text-[10px] text-theme-muted mr-1" aria-hidden>auth=yes {user.id.slice(0, 6)}</span>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-[13px] font-medium text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                  Admin
                </Link>
              )}
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-surface-2 px-2.5 py-1 text-[13px] text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
                aria-label="설정"
              >
                {user.name || "설정"}
              </Link>
              <form action={logoutAction} className="inline">
                <button type="submit" className="text-[13px] text-theme-muted hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-theme-primary px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
