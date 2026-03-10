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

/** Single top bar for all screen sizes (same as mobile). */
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
      if (trimmed.charAt(0) !== "{" && trimmed.charAt(0) !== "[") {
        return;
      }
      const data = JSON.parse(text) as { count?: number };
      const count = typeof data?.count === "number" ? data.count : 0;
      if (count !== lastCountRef.current) {
        lastCountRef.current = count;
        setUnreadCount(count);
      }
    } catch {
      // keep current count on error (e.g. HTML or invalid JSON)
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
    const onReadAll = () => {
      lastCountRef.current = 0;
      setUnreadCount(0);
    };
    const onNew = () => {
      lastCountRef.current += 1;
      setUnreadCount((c) => c + 1);
    };
    const onRead = () => {
      lastCountRef.current = Math.max(0, lastCountRef.current - 1);
      setUnreadCount((c) => Math.max(0, c - 1));
    };
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
    <>
      {/* Top bar — same on mobile and desktop */}
      <header className="border-b border-theme-border/60 bg-theme-surface sticky top-0 z-20 shrink-0" role="banner">
        <div className="flex items-center justify-between gap-2 px-4 py-3 max-w-[100vw]">
          <CellahLogo className="text-[17px] shrink-0" />
          <nav className="flex items-center gap-3 flex-wrap justify-end" aria-label="Main navigation">
            <Link href="/search" className="p-1.5 text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="Search">
              <SearchIcon className="w-5 h-5" />
            </Link>
            {user && (
              <Link
                href="/notifications"
                className="text-[15px] text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded inline-flex items-center gap-1.5"
                aria-label={displayCount > 0 ? `Notifications, ${displayCount} unread` : "Notifications"}
              >
                Notifications
                {displayCount > 0 && (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-theme-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-theme-primary tabular-nums">
                    {displayCount > 99 ? "99+" : displayCount > 9 ? "9+" : displayCount}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <>
                {process.env.NODE_ENV !== "production" && (
                  <span className="text-[10px] text-theme-muted mr-1" aria-hidden>auth=yes {user.id.slice(0, 6)}</span>
                )}
                <span className="inline-flex items-center rounded-full border border-theme-border bg-theme-surface-2 px-2.5 py-1 text-[13px] text-theme-primary" aria-label={user.name ? `Welcome, ${user.name}` : "Welcome"}>
                  {user.name || "Welcome"}
                </span>
                {isAdmin && (
                  <>
                    <Link href="/admin" className="text-[15px] font-medium text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="Admin Console">
                      Admin
                    </Link>
                    <a href="/api/debug/auth" target="_blank" rel="noopener noreferrer" className="text-[15px] text-theme-muted hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="Debug auth">
                      Debug
                    </a>
                  </>
                )}
                <form action={logoutAction} className="inline">
                  <button type="submit" className="text-[15px] text-theme-muted hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/onboarding" className="text-[15px] text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                Sign in
              </Link>
            )}
            <Link href="/feed" className="text-[15px] text-theme-primary hover:opacity-80">Feed</Link>
            <Link href="/write" className="text-[15px] font-medium text-theme-primary hover:text-theme-accent">Write</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
