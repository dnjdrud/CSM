"use server";

import { getSession } from "@/lib/auth/session";
import { callOpenAI } from "@/lib/ai/openai";
import { upsertClipRecommendations } from "@/lib/data/supabaseRepository";

interface ClipSuggestion {
  start_seconds: number;
  end_seconds: number;
  summary: string;
}

/** Parse and validate AI clip output. Returns [] on any failure — never throws. */
function parseClips(raw: string): ClipSuggestion[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) return [];
    const clips: ClipSuggestion[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const r = item as Record<string, unknown>;
      const start = r.start_seconds;
      const end = r.end_seconds;
      const summary = r.summary;
      // Validate: numbers only, start < end, summary non-empty string
      if (
        typeof start !== "number" ||
        typeof end !== "number" ||
        typeof summary !== "string" ||
        !summary.trim() ||
        start < 0 ||
        end <= start
      ) continue;
      clips.push({ start_seconds: start, end_seconds: end, summary: summary.trim() });
    }
    return clips.slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * Generate up to 3 clip recommendations for a post using its transcript.
 * Saves results to post_clip_recommendations table.
 */
export async function generateClipRecommendationsAction(
  postId: string,
  transcript: string
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };

  if (!transcript.trim()) return { ok: false, error: "Transcript is empty" };

  const prompt = `You are a short-form video editor. Analyze this YouTube transcript and select the 3 best segments for Reels or Shorts.

Selection criteria (in priority order):
1. Emotionally strong moments — personal stories, turning points, vulnerable confessions
2. High-impact statements — quotable lines, clear convictions, memorable phrases
3. Practical takeaways — actionable advice delivered concisely

Rules:
- Each clip must be 30–90 seconds long (end_seconds - start_seconds between 30 and 90)
- Clips must NOT overlap
- Choose segments that stand alone without context
- Do NOT pick random or transitional segments

Transcript:
---
${transcript.slice(0, 8000)}
---

Return a JSON array of exactly 3 objects. No explanation, no markdown. JSON only:
[
  { "start_seconds": number, "end_seconds": number, "summary": "한 문장 설명 (Korean)" },
  { "start_seconds": number, "end_seconds": number, "summary": "한 문장 설명 (Korean)" },
  { "start_seconds": number, "end_seconds": number, "summary": "한 문장 설명 (Korean)" }
]`;

  const result = await callOpenAI([{ role: "user", content: prompt }], { maxTokens: 512, temperature: 0.2 });

  if ("error" in result) return { ok: false, error: result.error };

  const clips = parseClips(result.text);
  if (clips.length === 0) return { ok: false, error: "AI response contained no valid clip segments" };

  const saved = await upsertClipRecommendations(
    postId,
    clips.map((c, i) => ({
      startTimeSeconds: c.start_seconds,
      endTimeSeconds: c.end_seconds,
      summary: c.summary,
      sortOrder: i,
    }))
  );

  if (!saved.ok) return { ok: false, error: saved.error ?? "Failed to save clips" };
  return { ok: true, count: clips.length };
}
