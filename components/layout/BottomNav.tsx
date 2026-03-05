"use client";

import { usePathname, useSearchParams } from "next/navigation";

type TabKey = "home" | "connect" | "cell" | "profile";

type Tab = {
  key: TabKey;
  href: string;
  label: string;
  icon: string;
};

const TABS: Tab[] = [
  {
    key: "home",
    href: "/feed?scope=FOLLOWING",
    label: "Home",
    icon: "🏠",
  },
  {
    key: "connect",
    href: "/feed?scope=ALL",
    label: "Connect",
    icon: "🌐",
  },
  {
    key: "cell",
    href: "/cell",
    label: "Cell",
    icon: "💬",
  },
  {
    key: "profile",
    href: "/me",
    label: "Profile",
    icon: "👤",
  },
];

function isActive(tab: Tab, pathname: string, search: URLSearchParams): boolean {
  if (tab.key === "home" && pathname === "/feed") {
    const scope = search.get("scope");
    return scope === "FOLLOWING" || scope === null;
  }
  if (tab.key === "connect" && pathname === "/feed") {
    const scope = search.get("scope");
    return scope === "ALL";
  }
  if (tab.key === "cell") {
    return pathname.startsWith("/cell");
  }
  if (tab.key === "profile") {
    return pathname === "/me" || pathname.startsWith("/profile/");
  }
  return false;
}

export function BottomNav() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const search = searchParams ?? new URLSearchParams();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-theme-border/70 bg-theme-surface/95 backdrop-blur-sm shrink-0"
      aria-label="Primary tabs"
    >
      <ul className="flex items-stretch justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab, pathname, search);
          return (
            <li key={tab.key} className="flex-1">
              <a
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
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

