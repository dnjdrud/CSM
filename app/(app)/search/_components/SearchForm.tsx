"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SearchTab } from "./SearchResults";

export function SearchForm({
  initialQ,
  initialTab,
}: {
  initialQ: string;
  initialTab: SearchTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.set("q", q.trim());
    next.set("tab", initialTab);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="search-q" className="sr-only">
        Search query
      </label>
      <div className="flex gap-2">
        <input
          id="search-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts, people, and topics…"
          className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 text-sm placeholder:text-gray-500 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
          aria-describedby="search-hint"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          Search
        </button>
      </div>
      <p id="search-hint" className="mt-1.5 text-xs text-gray-500">
        Search by words. No trends, no ranking.
      </p>
    </form>
  );
}
