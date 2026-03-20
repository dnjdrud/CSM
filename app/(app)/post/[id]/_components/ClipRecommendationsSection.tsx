"use client";

import { useState } from "react";
import type { PostClipRecommendation } from "@/lib/domain/types";
import { generateClipsForPostAction } from "../actions";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ClipRecommendationsSection({
  postId,
  initialClips,
}: {
  postId: string;
  initialClips: PostClipRecommendation[];
}) {
  const [clips, setClips] = useState<PostClipRecommendation[]>(initialClips);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateClipsForPostAction(postId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Reload clips from server action's saved data
    const { getClipRecommendationsAction } = await import("../actions");
    const refreshed = await getClipRecommendationsAction(postId);
    setClips(refreshed);
  }

  return (
    <section className="mt-6 pt-6 border-t border-theme-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-theme-text-2">추천 클립 구간</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-theme-muted hover:border-theme-primary/50 hover:text-theme-text disabled:opacity-50 transition-all"
        >
          {loading ? "분석 중…" : clips.length > 0 ? "다시 생성" : "추천 클립 생성"}
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-theme-danger mb-3" role="alert">{error}</p>
      )}

      {clips.length === 0 && !loading && !error && (
        <p className="text-[13px] text-theme-muted">
          YouTube 자막을 분석하여 추천 클립 구간을 생성합니다.
        </p>
      )}

      {clips.length > 0 && (
        <ol className="space-y-2 list-none p-0">
          {clips.map((clip, i) => (
            <li key={clip.id} className="flex items-start gap-3 py-2.5 border-b border-theme-border/50 last:border-0">
              <span className="shrink-0 text-[11px] font-semibold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-theme-muted tabular-nums">
                  {formatTime(clip.startTimeSeconds)} – {formatTime(clip.endTimeSeconds)}
                </p>
                <p className="text-[13px] text-theme-text mt-0.5 leading-snug">
                  {clip.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
