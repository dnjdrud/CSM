"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

type TabKey = "home" | "mission" | "contents" | "profile";

type Tab = {
  key: TabKey;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}


function ContentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function MissionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const BASE_TABS: Tab[] = [
  { key: "home",     href: "/home",     Icon: HomeIcon },
  { key: "contents", href: "/contents", Icon: ContentsIcon },
  { key: "mission",  href: "/mission",  Icon: MissionIcon },
  { key: "profile",  href: "/me",       Icon: ProfileIcon },
];

function isActive(tab: Tab, pathname: string): boolean {
  if (tab.key === "home") return pathname === "/home" || pathname === "/feed";
  if (tab.key === "mission") return pathname.startsWith("/mission") || pathname.startsWith("/missions") || pathname.startsWith("/missionary");
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
    contents: t.nav.contents,
    mission: t.nav.mission,
    profile: t.nav.profile,
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-theme-border/70 bg-theme-surface/95 backdrop-blur-sm shrink-0"
      aria-label="Primary tabs"
    >
      <ul className="flex items-stretch justify-evenly px-2 py-1.5">
        {TABS.map((tab) => {
          const active = isActive(tab, pathname);
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-[11px] ${
                  active
                    ? "text-theme-primary font-medium"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  <tab.Icon className="w-5 h-5" />
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
