"use client";

import { useT } from "@/lib/i18n";

export type HomeTab = "feed";

export function HomeTabs() {
  const t = useT();
  return (
    <div
      aria-hidden="true"
      className="border-b border-theme-border sticky top-0 z-10 bg-theme-surface/95 backdrop-blur-sm"
    >
      <div className="h-[1px]" />
    </div>
  );
}
