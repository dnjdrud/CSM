"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabKey = "home" | "mission" | "cells" | "contents" | "profile";

type Tab = {
  key: TabKey;
  href: string;
  label: string;
  icon: string;
};

const BASE_TABS: Tab[] = [
  { key: "home",     href: "/home",     label: "홈",     icon: "🏠" },
  { key: "cells",    href: "/cells",    label: "셀",     icon: "💬" },
  { key: "contents", href: "/contents", label: "컨텐츠", icon: "🎬" },
  { key: "mission",  href: "/mission",  label: "선교",   icon: "🌍" },
  { key: "profile",  href: "/me",       label: "프로필", icon: "👤" },
];

function isActive(tab: Tab, pathname: string): boolean {
  if (tab.key === "home") return pathname === "/home" || pathname === "/feed";
  if (tab.key === "mission") return pathname.startsWith("/mission") || pathname.startsWith("/missions") || pathname.startsWith("/missionary");
  if (tab.key === "cells") return pathname.startsWith("/cells") || pathname.startsWith("/cell");
  if (tab.key === "contents") return pathname.startsWith("/contents") || pathname.startsWith("/theology");
  if (tab.key === "profile") return pathname === "/me" || pathname.startsWith("/profile/");
  return false;
}

export function BottomNav({ profileHref = "/me" }: { profileHref?: string }) {
  const pathname = usePathname() || "/";

  const TABS = BASE_TABS.map((tab) =>
    tab.key === "profile" ? { ...tab, href: profileHref } : tab
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-theme-border/70 bg-theme-surface/95 backdrop-blur-sm shrink-0"
      aria-label="Primary tabs"
    >
      <ul className="flex items-stretch justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab, pathname);
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-[11px] ${
                  active
                    ? "text-theme-primary font-medium"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
