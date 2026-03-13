"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";

export type HomeTab = "feed" | "prayer";

export function HomeTabs({ activeTab }: { activeTab: HomeTab }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const TABS: { key: HomeTab; label: string; icon: string }[] = [
    { key: "feed",   label: t.home.feedTab,   icon: "✦" },
    { key: "prayer", label: t.home.prayerTab, icon: "🙏" },
  ];

  function setTab(tab: HomeTab) {
    const next = new URLSearchParams(searchParams);
    if (tab === "feed") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    const qs = next.toString();
    router.push(qs ? `/home?${qs}` : "/home");
  }

  return (
    <div
      role="tablist"
      aria-label={t.home.feedTab}
      className="flex border-b border-theme-border sticky top-0 z-10 bg-theme-surface/95 backdrop-blur-sm"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-medium border-b-2 transition-colors duration-150 ${
              isActive
                ? "border-theme-primary text-theme-primary"
                : "border-transparent text-theme-muted hover:text-theme-text"
            }`}
          >
            <span aria-hidden className="text-[13px]">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
