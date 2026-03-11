"use client";

import type { ReactNode } from "react";

/**
 * 검색어와 일치하는 텍스트를 <mark>로 강조 표시합니다.
 */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  if (!query.trim()) return <>{text}</>;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // regex escape

  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
