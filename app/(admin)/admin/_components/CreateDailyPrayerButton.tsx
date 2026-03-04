"use client";

import { useState } from "react";
import Link from "next/link";
import { DangerZoneConfirm } from "./DangerZoneConfirm";
import { createDailyPrayerAction } from "../actions";

export function CreateDailyPrayerButton() {
  const [result, setResult] = useState<{ ok: true; postId: string; reused: boolean } | { ok: false; error: string } | null>(null);

  async function handleConfirm() {
    const res = await createDailyPrayerAction();
    setResult(res);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800">Daily Prayer</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create today&apos;s Daily Prayer thread. Idempotent: if one already exists for today, no duplicate is created.
      </p>
      {result?.ok && result.reused && (
        <p className="mt-3 text-sm text-gray-600">Today&apos;s Daily Prayer already exists.</p>
      )}
      {result?.ok && !result.reused && (
        <p className="mt-3 text-sm text-green-700">
          Daily Prayer created. <Link href={`/post/${result.postId}`} className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded">View post</Link>
        </p>
      )}
      {result && !result.ok && (
        <p className="mt-3 text-sm text-red-600">{result.error}</p>
      )}
      <div className="mt-4">
        <DangerZoneConfirm
          title="Create Today's Daily Prayer"
          description="Create a new PRAYER post (MEMBERS visibility) with today's date as title and revalidate the feed. If a daily prayer for today already exists, nothing will change."
          confirmText="create daily prayer"
          onConfirm={handleConfirm}
          buttonLabel="Create Today's Daily Prayer"
        />
      </div>
    </div>
  );
}
