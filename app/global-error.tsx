"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logErrorClient } from "@/lib/logging/clientLogger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
    logErrorClient("GLOBAL", "Unhandled App Error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-theme-bg text-theme-text p-8 font-sans">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold text-theme-danger mb-2">Something went wrong</h1>
          <p className="text-sm text-theme-muted mb-4">{error.message}</p>
          <pre className="bg-theme-surface border border-theme-border p-3 rounded text-xs overflow-auto mb-6 whitespace-pre-wrap text-theme-muted">
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
              href="/"
              className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm text-theme-text hover:bg-theme-surface-2"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
