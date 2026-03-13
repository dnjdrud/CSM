"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SearchTab } from "./SearchResults";
import { ROLE_DISPLAY, type UserRole } from "@/lib/domain/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "LAY", label: ROLE_DISPLAY["LAY"] },
  { value: "MINISTRY_WORKER", label: ROLE_DISPLAY["MINISTRY_WORKER"] },
  { value: "PASTOR", label: ROLE_DISPLAY["PASTOR"] },
  { value: "MISSIONARY", label: ROLE_DISPLAY["MISSIONARY"] },
  { value: "SEMINARIAN", label: ROLE_DISPLAY["SEMINARIAN"] },
];

const DENOMINATIONS = [
  "장로교 (통합)", "장로교 (합동)", "장로교 (기타)", "감리교", "침례교",
  "성결교", "순복음 / 오순절", "구세군", "루터교", "기타",
];

export function SearchForm({
  initialQ,
  initialTab,
  initialRole,
  initialDenomination,
}: {
  initialQ: string;
  initialTab: SearchTab;
  initialRole?: string;
  initialDenomination?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [role, setRole] = useState(initialRole ?? "");
  const [denomination, setDenomination] = useState(initialDenomination ?? "");
  const tab = initialTab;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (q.trim()) next.set("q", q.trim()); else next.delete("q");
    if (tab === "people" && role) next.set("role", role); else next.delete("role");
    if (tab === "people" && denomination) next.set("denomination", denomination); else next.delete("denomination");
    router.push(`/search?${next.toString()}`);
  }

  function clearFilters() {
    setRole("");
    setDenomination("");
    const next = new URLSearchParams(searchParams);
    next.delete("role");
    next.delete("denomination");
    if (q.trim()) next.set("q", q.trim());
    router.push(`/search?${next.toString()}`);
  }

  const selectCls = "w-full rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-theme-text text-sm focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary";
  const hasFilters = !!(role || denomination);

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="search-q" className="sr-only">검색어</label>
        <div className="flex gap-2">
          <input
            id="search-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="포스트, 사람, 주제 검색…"
            className="flex-1 rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-theme-text text-sm placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
            aria-describedby="search-hint"
          />
          <button
            type="submit"
            className="rounded-md bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
          >
            검색
          </button>
        </div>
        <p id="search-hint" className="mt-1.5 text-xs text-theme-muted">
          키워드로 검색합니다.
        </p>
      </div>

      {tab === "people" && (
        <details open={hasFilters} className="group">
          <summary className="cursor-pointer list-none text-xs font-medium text-theme-muted hover:text-theme-text flex items-center gap-1 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 3l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            필터
            {hasFilters && (
              <span className="ml-1 rounded-full bg-theme-primary text-white text-[10px] px-1.5 py-0.5">적용됨</span>
            )}
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-role" className="block text-[11px] font-medium text-gray-500 mb-1">역할</label>
              <select id="filter-role" value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                <option value="">전체 역할</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-denomination" className="block text-[11px] font-medium text-gray-500 mb-1">교단</label>
              <select id="filter-denomination" value={denomination} onChange={(e) => setDenomination(e.target.value)} className={selectCls}>
                <option value="">전체 교단</option>
                {DENOMINATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs text-theme-muted hover:text-theme-text underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded"
            >
              필터 초기화
            </button>
          )}
        </details>
      )}
    </form>
  );
}
