"use client";

import Link from "next/link";
import { ComposeBox } from "@/components/ComposeBox";
import { composePostAction } from "./actions";

export default function WritePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Share
      </h1>
      <p className="mt-3 text-sm text-gray-500 italic">
        This is a shared space, not a stage.
      </p>
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
        <ComposeBox composePostAction={composePostAction} defaultExpanded defaultMoreOptions redirectOnSuccess="/feed" />
      </div>
      <p className="mt-4">
        <Link
          href="/feed"
          className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
