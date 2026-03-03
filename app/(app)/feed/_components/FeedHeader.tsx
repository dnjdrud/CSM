import { Suspense } from "react";
import Link from "next/link";
import { FeedScopeToggle } from "@/components/FeedScopeToggle";

type Props = {
  initialScope: "all" | "following";
  isAdmin: boolean;
};

export function FeedHeader({ initialScope, isAdmin }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="h-12 w-full border-b border-theme-border" />}>
          <FeedScopeToggle initialScope={initialScope} />
        </Suspense>
      </div>
      {isAdmin && (
        <Link
          href="/admin"
          className="shrink-0 px-3 py-2 text-[13px] font-medium text-theme-muted transition-colors duration-200 hover:text-theme-text hover:bg-theme-surface-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-80"
        >
          Admin Console
        </Link>
      )}
    </div>
  );
}
