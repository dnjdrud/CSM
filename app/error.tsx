"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 p-8 font-sans">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-700 mb-4">{error.message}</p>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-6 whitespace-pre-wrap">
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
            href="/"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
