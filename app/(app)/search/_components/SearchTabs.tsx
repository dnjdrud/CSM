"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SearchTab } from "./SearchResults";

const TABS: { value: SearchTab; label: string }[] = [
  { value: "posts", label: "Posts" },
  { value: "people", label: "People" },
  { value: "tags", label: "Tags" },
];

export function SearchTabs({ currentTab }: { currentTab: SearchTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  function setTab(tab: SearchTab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (q) next.set("q", q);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <nav className="flex gap-6 border-b border-gray-200" aria-label="Search tabs">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTab(value)}
          aria-current={currentTab === value ? "true" : undefined}
          className={`pb-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded-t -mb-px ${
            currentTab === value
              ? "text-gray-800 border-b-2 border-gray-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
