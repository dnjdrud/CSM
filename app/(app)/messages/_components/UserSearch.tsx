"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { searchUsersAction } from "../actions";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const users = await searchUsersAction(val);
        setResults(users);
      });
    }, 300);
  }

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="사람 검색해서 메시지 보내기…"
          className="w-full rounded-xl border border-theme-border bg-theme-surface-2 px-4 py-2.5 text-[14px] text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-theme-muted">
            검색 중…
          </span>
        )}
      </div>

      {query.trim() && results.length > 0 && (
        <ul className="mt-2 rounded-xl border border-theme-border bg-theme-surface shadow-sm overflow-hidden" role="list">
          {results.map((user) => (
            <li key={user.id}>
              <Link
                href={`/messages/${user.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-theme-surface-2 transition-colors"
                onClick={() => { setQuery(""); setResults([]); }}
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" className="h-9 w-9 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-theme-text truncate">{user.name}</p>
                  {user.affiliation && (
                    <p className="text-[12px] text-theme-muted truncate">{user.affiliation}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !isPending && results.length === 0 && (
        <p className="mt-2 text-[13px] text-theme-muted text-center py-3">검색 결과가 없습니다</p>
      )}
    </div>
  );
}
