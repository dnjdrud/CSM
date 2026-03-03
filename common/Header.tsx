"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";
import { CellahLogo } from "@/components/CellahLogo";

export type HeaderUser = { id: string; name: string; isAdmin: boolean } | null;

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

const NAV_LINKS = [
  { href: "/feed", label: "Community" },
  { href: "/me", label: "My Space" },
  { href: "/topics", label: "Topics" },
  { href: "/search", label: "Search" },
  { href: "/notifications", label: "Notifications" },
  { href: "/write", label: "Write" },
  { href: "/support", label: "Support" },
];

function NotificationsNavLink({
  unreadCount,
  className,
}: {
  unreadCount: number;
  className?: string;
}) {
  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : String(unreadCount);
  const ariaLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={ariaLabel}
      className={`min-h-[44px] inline-flex items-center ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-2 min-w-[7.5rem]">
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span
            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-theme-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-theme-primary tabular-nums"
            aria-hidden
          >
            {badgeLabel}
          </span>
        )}
      </span>
    </Link>
  );
}

/** Mobile: top bar. Desktop: left fixed sidebar. */
export function Header({ user, initialUnreadCount = 0 }: HeaderProps) {
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
      {/* Mobile: top bar — Cellah logo left, search + nav right */}
      <header className="md:hidden border-b border-theme-border/60 bg-theme-surface sticky top-0 z-20" role="banner">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <CellahLogo className="text-[17px]" />
          <nav className="flex items-center gap-3 flex-wrap" aria-label="Main navigation">
            <Link href="/search" className="p-1.5 text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="Search">
              <SearchIcon className="w-5 h-5" />
            </Link>
            {user ? (
              <>
                <span className="inline-flex items-center rounded-full border border-theme-border bg-theme-surface-2 px-2.5 py-1 text-[13px] text-theme-primary" aria-label={user.name ? `Welcome, ${user.name}` : "Welcome"}>
                  {user.name || "Welcome"}
                </span>
                <Link href={`/profile/${user.id}`} className="text-[15px] text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                  Profile
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className="text-[15px] font-medium text-theme-primary hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded" aria-label="Admin Console">
                    Admin
                  </Link>
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

      {/* Desktop: left fixed sidebar (md and up) — Cellah */}
      <aside className="hidden md:flex md:flex-col md:w-[220px] md:shrink-0 md:sticky md:top-0 md:h-screen md:border-r md:border-theme-border/60 md:bg-theme-surface md:py-6 md:px-4" aria-label="Main navigation">
        <CellahLogo className="text-[17px] mb-6" showIcon />
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) =>
            href === "/notifications" ? (
              <NotificationsNavLink
                key={href}
                unreadCount={displayCount}
                className="text-[15px] py-2 px-2 -mx-2 rounded-md text-theme-primary hover:opacity-80 hover:bg-theme-border/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
              />
            ) : (
              <Link
                key={href}
                href={href}
                className={`text-[15px] py-2 px-2 -mx-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 ${
                  label === "Write" ? "font-medium text-theme-primary hover:bg-theme-border/30" : "text-theme-primary hover:opacity-80 hover:bg-theme-border/30"
                }`}
              >
                {label}
              </Link>
            )
          )}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="text-[15px] py-2 px-2 -mx-2 rounded-md font-medium text-theme-primary hover:text-theme-primary hover:bg-theme-border/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
              aria-label="Admin Console"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-6 border-t border-theme-border/60">
          {user ? (
            <div className="space-y-3">
              <p className="text-[15px] font-medium text-theme-primary">
                {user.name ? `${user.name}, welcome` : "Welcome"}
              </p>
              <Link href={`/profile/${user.id}`} className="block text-[13px] text-theme-muted hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                My profile
              </Link>
              <div className="text-[12px] text-theme-muted leading-snug space-y-1">
                <p className="font-medium text-theme-primary">Haven for Digital Exodus</p>
                <ul className="list-none space-y-0.5 pl-0" aria-label="Community guidelines">
                  <li>• Minimalism — less noise, more presence</li>
                  <li>• Organic connection — cells of community</li>
                  <li>• Space for contemplation — Selah&apos;s rest</li>
                  <li>• If something feels unsafe, please report it</li>
                </ul>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="text-[13px] text-theme-muted hover:text-theme-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/onboarding" className="text-[15px] font-medium text-theme-primary hover:text-theme-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
