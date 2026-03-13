"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";

export type ProfileTabKey = "posts" | "contents" | "crow" | "spiritual";

export function ProfileTabs({ profileId }: { profileId: string }) {
  const t = useT();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as ProfileTabKey) ?? "posts";

  const TABS: { value: ProfileTabKey; label: string; icon: string }[] = [
    { value: "posts",     label: t.profilePage.postsTab,    icon: "📝" },
    { value: "contents",  label: t.profilePage.contentsTab, icon: "🎬" },
    { value: "crow",      label: t.profilePage.crowTab,     icon: "🐦" },
    { value: "spiritual", label: t.profilePage.spiritualTab, icon: "✝️" },
  ];

  return (
    <nav className="flex border-b border-theme-border" aria-label={t.profilePage.postsTab}>
      {TABS.map(({ value, label, icon }) => {
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
            <span className="text-[16px] leading-none" aria-hidden>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
