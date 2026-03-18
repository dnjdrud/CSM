"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Position = "top" | "bottom";

export function ContentsBottomSearchBar({
  initialQ = "",
  position = "bottom",
}: { initialQ?: string; position?: Position }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function submit(nextQ: string) {
    const trimmed = nextQ.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    const qs = new URLSearchParams();
    qs.set("tab", "posts");
    qs.set("q", trimmed);
    router.push(`/search?${qs.toString()}`);
  }

  const wrapperClass =
    position === "top"
      ? "border-b border-theme-border/60 bg-theme-surface px-4 py-3"
      : "sticky bottom-0 z-10 border-t border-theme-border/60 bg-theme-surface/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div className={wrapperClass}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="flex items-center gap-2"
        aria-label="콘텐츠 검색"
      >
        <div className="flex-1 relative">
          <label htmlFor="contents-bottom-search" className="sr-only">
            검색어
          </label>
          <input
            id="contents-bottom-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="콘텐츠 검색…"
            className="w-full rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-theme-text text-sm placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
        >
          검색
        </button>
      </form>
    </div>
  );
}

