"use client";

import { useRouter } from "next/navigation";
import { BORDER, PADDING, TYPOGRAPHY, FOCUS_RING, TRANSITION } from "@/lib/design/tokens";

type Scope = "all" | "following";

/** Tab-style scope switch. Uses design tokens for tab padding and typography. */
export function FeedScopeToggle({ initialScope = "all" }: { initialScope?: Scope }) {
  const router = useRouter();
  const validScope = initialScope === "following" ? "following" : "all";

  function setScope(value: Scope) {
    router.push(value === "all" ? "/feed" : "/feed?scope=following");
  }

  const tabBase = `${PADDING.tab} ${TYPOGRAPHY.tab} border-b-2 -mb-px rounded-t ${TRANSITION} ${FOCUS_RING} active:bg-gray-100`;

  return (
    <div role="tablist" aria-label="Feed scope" className={`flex border-b ${BORDER.default}`}>
      <button
        type="button"
        role="tab"
        aria-selected={validScope === "all"}
        onClick={() => setScope("all")}
        className={`${tabBase} transition-[color,border-color,background-color] duration-200 ${
          validScope === "all"
            ? "text-gray-900 border-gray-900"
            : "text-neutral-500 hover:text-gray-700 hover:bg-gray-50/50 border-transparent"
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
            ? "text-gray-900 border-gray-900"
            : "text-neutral-500 hover:text-gray-700 hover:bg-gray-50/50 border-transparent"
        }`}
      >
        Following
      </button>
    </div>
  );
}
