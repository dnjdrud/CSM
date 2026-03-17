"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TopicsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Topics error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-theme-danger font-sans text-sm mb-4">
        Something went wrong: {error.message}
      </p>
      <pre className="bg-theme-surface border border-theme-border p-3 rounded text-xs overflow-auto mb-4">
        {error.stack}
      </pre>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm text-theme-text hover:bg-theme-surface-2"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm text-theme-text hover:bg-theme-surface-2"
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
