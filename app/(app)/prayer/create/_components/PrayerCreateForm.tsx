"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";
import type { PrayerCategory } from "@/lib/domain/types";
import { createPrayerRequestAction } from "../actions";

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "전체 공개",
  CELL: "내 셀만",
  PRIVATE: "나만 보기",
};

export function PrayerCreateForm() {
  const router = useRouter();
  const [category, setCategory] = useState<PrayerCategory>("PERSONAL");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "CELL" | "PRIVATE">("PUBLIC");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 5) {
      setError("기도 내용은 5자 이상 입력해 주세요.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("기도 내용은 1000자 이하로 입력해 주세요.");
      return;
    }
    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.append("content", trimmed);
    fd.append("category", category);
    fd.append("visibility", visibility);

    try {
      await createPrayerRequestAction(fd);
      // createPrayerRequestAction calls redirect() on success, so this line won't be reached
    } catch (e) {
      // redirect() throws internally in Next.js — re-throw it so the router handles it
      const err = e as { digest?: string };
      if (err?.digest?.startsWith("NEXT_REDIRECT")) throw e;
      setPending(false);
      setError(e instanceof Error ? e.message : "기도 요청 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-theme-text">카테고리</label>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(PRAYER_CATEGORY_LABELS) as [PrayerCategory, string][]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={value}
                checked={category === value}
                onChange={() => setCategory(value)}
                className="accent-theme-primary"
              />
              <span className="text-[13px] text-theme-text">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-theme-text">기도 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          required
          minLength={5}
          maxLength={1000}
          placeholder="기도 제목을 나눠주세요. 구체적일수록 함께 기도하기 좋습니다."
          className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
        />
        <p className="text-[11px] text-theme-muted text-right">{content.length}/1000</p>
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-theme-text">공개 범위</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "CELL" | "PRIVATE")}
          className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
        >
          {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "등록 중…" : "기도 요청 등록"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 rounded-xl border border-theme-border text-[14px] text-theme-muted hover:bg-theme-surface-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
