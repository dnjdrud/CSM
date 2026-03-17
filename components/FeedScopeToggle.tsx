"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BORDER, PADDING, TYPOGRAPHY, FOCUS_RING, TRANSITION } from "@/lib/design/tokens";

type Scope = "all" | "following";
type Context = "feed" | "home";

type Props = {
  initialScope?: Scope;
  /** where this toggle is used; controls target URL */
  context?: Context;
};

/** Tab-style scope switch. Uses design tokens for tab padding and typography. */
export function FeedScopeToggle({ initialScope = "all", context = "feed" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validScope: Scope = initialScope === "following" ? "following" : "all";

  function setScope(value: Scope) {
    if (context === "home") {
      const next = new URLSearchParams(searchParams);
      // 홈에서는 항상 feed 탭 유지
      next.set("tab", "feed");
      if (value === "all") {
        next.delete("scope");
      } else {
        next.set("scope", "following");
      }
      const qs = next.toString();
      router.push(qs ? `/home?${qs}` : "/home");
      return;
    }

    // legacy /feed 용
    router.push(value === "all" ? "/feed" : "/feed?scope=following");
  }

  const tabBase = `flex-1 text-center ${PADDING.tab} ${TYPOGRAPHY.tab} border-b-2 -mb-px rounded-t ${TRANSITION} ${FOCUS_RING} active:bg-theme-surface-2`;
  const tabLinkBase = `flex-1 text-center ${PADDING.tab} ${TYPOGRAPHY.tab} border-b-2 -mb-px rounded-t border-transparent text-theme-muted hover:text-theme-text hover:bg-theme-surface-2/50 transition-[color,background-color] duration-200`;

  return (
    <div role="tablist" aria-label="Feed scope" className={`flex border-b ${BORDER.default}`}>
      <button
        type="button"
        role="tab"
        aria-selected={validScope === "all"}
        onClick={() => setScope("all")}
        className={`${tabBase} transition-[color,border-color,background-color] duration-200 ${
          validScope === "all"
            ? "text-theme-primary border-theme-primary"
            : "text-theme-muted hover:text-theme-text hover:bg-theme-surface-2/50 border-transparent"
        }`}
      >
        All
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={validScope === "following"}
        onClick={() => setScope("following")}
        className={`${tabBase} ${
          validScope === "following"
            ? "text-theme-primary border-theme-primary"
            : "text-theme-muted hover:text-theme-text hover:bg-theme-surface-2/50 border-transparent"
        }`}
      >
        Following
      </button>
      {context === "home" && (
        <Link
          href="/topics"
          role="tab"
          aria-selected={false}
          className={tabLinkBase}
        >
          Tags
        </Link>
      )}
    </div>
  );
}
