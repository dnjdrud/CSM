"use client";

import { useT } from "@/lib/i18n";

export type HomeTab = "feed";

export function HomeTabs() {
  const t = useT();
  return (
    <div
      role="tablist"
      aria-label={t.home.feedTab}
      className="flex border-b border-theme-border sticky top-0 z-10 bg-theme-surface/95 backdrop-blur-sm"
    >
      <div className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-medium border-b-2 border-theme-primary text-theme-primary">
        <span aria-hidden className="text-[13px]">✦</span>
        {t.home.feedTab}
      </div>
    </div>
  );
}
