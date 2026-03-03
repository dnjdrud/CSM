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
      <p className="text-red-600 font-sans text-sm mb-4">
        Something went wrong: {error.message}
      </p>
      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-4">
        {error.stack}
      </pre>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
