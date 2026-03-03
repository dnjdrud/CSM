"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";

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
            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 tabular-nums"
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
      {/* Mobile: single top bar (only under md) */}
      <header className="md:hidden border-b border-gray-200 bg-white sticky top-0 z-20" role="banner">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link href="/" className="text-gray-900 font-semibold text-[15px] tracking-tight hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
            CSM
          </Link>
          <nav className="flex items-center gap-4 flex-wrap" aria-label="Main navigation">
            {user ? (
              <>
                <span className="text-[15px] text-gray-700" aria-label={user.name ? `Welcome, ${user.name}` : "Welcome"}>
                  {user.name ? `${user.name}, welcome` : "Welcome"}
                </span>
                <Link href={`/profile/${user.id}`} className="text-[15px] text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
                  Profile
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className="text-[15px] font-medium text-gray-800 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded" aria-label="Admin Console">
                    Admin Console
                  </Link>
                )}
                <form action={logoutAction} className="inline">
                  <button type="submit" className="text-[15px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/onboarding" className="text-[15px] text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
                Sign in
              </Link>
            )}
            <Link href="/feed" className="text-[15px] text-gray-700 hover:text-gray-900">Community</Link>
            <Link href="/write" className="text-[15px] font-medium text-gray-900 hover:text-gray-700">Write</Link>
          </nav>
        </div>
      </header>

      {/* Desktop: left fixed sidebar (md and up) */}
      <aside className="hidden md:flex md:flex-col md:w-[220px] md:shrink-0 md:sticky md:top-0 md:h-screen md:border-r md:border-gray-200 md:bg-white md:py-6 md:px-4" aria-label="Main navigation">
        <Link href="/" className="text-gray-900 font-semibold text-[17px] tracking-tight hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-6">
          CSM
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) =>
            href === "/notifications" ? (
              <NotificationsNavLink
                key={href}
                unreadCount={displayCount}
                className="text-[15px] py-2 px-2 -mx-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
              />
            ) : (
              <Link
                key={href}
                href={href}
                className={`text-[15px] py-2 px-2 -mx-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 ${
                  label === "Write" ? "font-medium text-gray-900 hover:bg-gray-100" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            )
          )}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="text-[15px] py-2 px-2 -mx-2 rounded-md font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
              aria-label="Admin Console"
            >
              Admin Console
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
          {user ? (
            <div className="space-y-3">
              <p className="text-[15px] font-medium text-gray-900">
                {user.name ? `${user.name}, welcome` : "Welcome"}
              </p>
              <Link href={`/profile/${user.id}`} className="block text-[13px] text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
                My profile
              </Link>
              <div className="text-[12px] text-gray-500 leading-snug space-y-1">
                <p className="font-medium text-gray-600">Welcome to CSM</p>
                <ul className="list-none space-y-0.5 pl-0" aria-label="Community guidelines">
                  <li>• Share prayers, reflections, and ministry updates</li>
                  <li>• Respond with presence, not performance</li>
                  <li>• “Public” means all logged-in members — not the open internet</li>
                  <li>• If something feels unsafe, please report it</li>
                  <li>• This community grows through trust and care</li>
                </ul>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="text-[13px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/onboarding" className="text-[15px] font-medium text-gray-900 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded">
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
