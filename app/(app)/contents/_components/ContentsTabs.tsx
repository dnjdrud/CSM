"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type ContentsTab = "content" | "request";

const TABS: { key: ContentsTab; label: string; icon: string }[] = [
  { key: "content", label: "콘텐츠", icon: "🎬" },
  { key: "request", label: "요청",   icon: "📬" },
];

export function ContentsTabs({ activeTab }: { activeTab: ContentsTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(tab: ContentsTab) {
    const next = new URLSearchParams(searchParams);
    if (tab === "content") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    const qs = next.toString();
    router.push(qs ? `/contents?${qs}` : "/contents");
  }

  return (
    <div
      role="tablist"
      aria-label="컨텐츠 탭"
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
