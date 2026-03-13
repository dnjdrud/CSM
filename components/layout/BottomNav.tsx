"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

type TabKey = "home" | "mission" | "cells" | "contents" | "profile";

type Tab = {
  key: TabKey;
  href: string;
  icon: string;
};

const BASE_TABS: Tab[] = [
  { key: "home",     href: "/home",     icon: "🏠" },
  { key: "cells",    href: "/cells",    icon: "💬" },
  { key: "contents", href: "/contents", icon: "🎬" },
  { key: "mission",  href: "/mission",  icon: "🌍" },
  { key: "profile",  href: "/me",       icon: "👤" },
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
  const t = useT();

  const TABS = BASE_TABS.map((tab) =>
    tab.key === "profile" ? { ...tab, href: profileHref } : tab
  );

  const labels: Record<TabKey, string> = {
    home: t.nav.home,
    cells: t.nav.cells,
    contents: t.nav.contents,
    mission: t.nav.mission,
    profile: t.nav.profile,
  };

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
                <span>{labels[tab.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
