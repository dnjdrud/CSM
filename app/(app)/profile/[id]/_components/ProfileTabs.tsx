"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";
import { IconCross, IconFeather, IconFilm } from "@/components/ui/Icon";

export type ProfileTabKey = "posts" | "contents" | "crow" | "spiritual";

export function ProfileTabs({ profileId }: { profileId: string }) {
  const t = useT();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as ProfileTabKey) ?? "posts";

  const TABS: {
    value: ProfileTabKey;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: "posts",     label: t.profilePage.postsTab,     Icon: IconMessageSquareText },
    { value: "contents",  label: t.profilePage.contentsTab,  Icon: IconFilm },
    { value: "crow",      label: t.profilePage.crowTab,      Icon: IconFeather },
    { value: "spiritual", label: t.profilePage.spiritualTab, Icon: IconCross },
  ];

  return (
    <nav className="flex border-b border-theme-border" aria-label={t.profilePage.postsTab}>
      {TABS.map(({ value, label, Icon }) => {
        const href =
          value === "posts"
            ? `/profile/${profileId}`
            : `/profile/${profileId}?tab=${value}`;
        const isActive = activeTab === value;
        return (
          <Link
            key={value}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-t ${
              isActive
                ? "border-theme-primary text-theme-primary"
                : "border-transparent text-theme-muted hover:text-theme-text hover:border-theme-border"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function IconMessageSquareText({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M7 8h10" />
      <path d="M7 12h7" />
    </svg>
  );
}
