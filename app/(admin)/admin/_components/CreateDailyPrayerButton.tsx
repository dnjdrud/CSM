"use client";

import { useState } from "react";
import Link from "next/link";
import { createDailyPrayerAction } from "../actions";

const DEFAULT_CONTENT = `Take a quiet moment today.
Share your prayer in the comments.
Let us carry one another.`;

export function CreateDailyPrayerButton() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: true; postId: string; reused: boolean } | { ok: false; error: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    const customContent = content.trim() !== DEFAULT_CONTENT.trim() ? content.trim() : undefined;
    const res = await createDailyPrayerAction(customContent);
    setResult(res);
    setPending(false);
  }

  return (
    <div className="rounded-xl border border-theme-border bg-theme-surface p-5">
      <h3 className="text-sm font-semibold text-gray-800">Daily Prayer</h3>
      <p className="mt-1 text-xs text-theme-subtle">
        오늘의 Daily Prayer 포스트를 생성합니다. 오늘 이미 생성된 경우 중복 생성되지 않습니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="dp-content" className="block text-xs font-medium text-theme-muted mb-1">
            본문 내용 <span className="text-gray-400 font-normal">(수정 가능)</span>
          </label>
          <textarea
            id="dp-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 resize-none"
            disabled={pending}
          />
        </div>

        {result?.ok === true && result.reused && (
          <p className="text-sm text-theme-muted">오늘의 Daily Prayer가 이미 존재합니다.</p>
        )}
        {result?.ok === true && !result.reused && (
          <p className="text-sm text-green-700">
            Daily Prayer가 생성되었습니다.{" "}
            <Link href={`/post/${result.postId}`} className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded">
              포스트 보기
            </Link>
          </p>
        )}
        {result?.ok === false && (
          <p className="text-sm text-red-600">{result.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "생성 중…" : "오늘의 Daily Prayer 생성"}
        </button>
      </form>
    </div>
  );
}
