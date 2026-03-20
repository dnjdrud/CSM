"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createPost } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { logInfo, logWarn, logError } from "@/lib/logging/systemLogger";
import { fetchYouTubeMetadata, type YouTubeMetadata } from "@/lib/services/youtubeMetadata";
import { fetchYouTubeTranscript, type TranscriptFetchResult } from "@/lib/services/youtubeTranscript";
import { generateContent } from "@/lib/services/aiContentGenerator";
import type { GeneratedContent } from "@/lib/services/aiContentGenerator";
import { parseYouTubeUrl } from "@/lib/utils/youtube";

/** Publish post and redirect to feed (e.g. from /write page). */
export async function publishPostAction(
  category: PostCategory,
  content: string,
  tagsInput?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  try {
    await assertRateLimit({
      userId: session.userId,
      action: "CREATE_POST",
      maxPerMinute: 15,
      maxPer10Min: 50,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Rate limit or server error" };
  }
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  try {
    await createPost({
      authorId: session.userId,
      category,
      content: trimmed,
      visibility: "PUBLIC",
      tags,
    });
    logInfo("SERVER_ACTION", "publishPostAction success", {
      userId: session.userId,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const display = (msg && msg.trim() !== "") ? msg : "Failed to create post (publish)";
    logError("SERVER_ACTION", "publishPostAction createPost error", {
      userId: session.userId,
      error: display,
    });
    return { ok: false, error: display };
  }
  revalidatePath("/feed");
  redirect("/feed");
}

/**
 * Generate AI summary, description, and tags for a YouTube video.
 * Tries transcript first; falls back to metadata if unavailable.
 */
export async function generateYouTubeContentAction(
  youtubeUrlOrId: string
): Promise<{ ok: true; data: GeneratedContent } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };

  const trimmed = youtubeUrlOrId.trim();
  if (!trimmed) return { ok: false, error: "No URL provided" };

  let videoId: string;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  } else {
    const parsed = parseYouTubeUrl(trimmed);
    if (!parsed.isValid) return { ok: false, error: parsed.error };
    videoId = parsed.videoId;
  }

  // Try transcript first
  const transcriptResult = await fetchYouTubeTranscript(videoId);
  logInfo("SERVER_ACTION", "generateYouTubeContentAction transcript", {
    videoId,
    ok: transcriptResult.ok,
    error: transcriptResult.ok ? undefined : transcriptResult.error,
  });

  if (transcriptResult.ok) {
    const aiResult = await generateContent({
      source: "transcript",
      context: transcriptResult.transcriptText,
    });
    logInfo("SERVER_ACTION", "generateYouTubeContentAction claude(transcript)", {
      ok: aiResult.ok,
      error: aiResult.ok ? undefined : aiResult.error,
    });
    if (aiResult.ok) return aiResult;
  }

  // Fall back to metadata
  const metaResult = await fetchYouTubeMetadata(videoId);
  logInfo("SERVER_ACTION", "generateYouTubeContentAction metadata", {
    videoId,
    ok: metaResult.ok,
    error: metaResult.ok ? undefined : metaResult.error,
  });

  if (!metaResult.ok) {
    const transcriptErr = transcriptResult.ok ? "" : ` (자막: ${transcriptResult.error})`;
    return { ok: false, error: `메타데이터 오류: ${metaResult.error}${transcriptErr}` };
  }

  const { title, description, channelTitle } = metaResult.data;
  const context = [title, description, channelTitle].filter(Boolean).join("\n");
  const aiResult = await generateContent({ source: "metadata", context, videoTitle: title });
  logInfo("SERVER_ACTION", "generateYouTubeContentAction claude(metadata)", {
    ok: aiResult.ok,
    error: aiResult.ok ? undefined : aiResult.error,
  });
  return aiResult;
}

/** Compose post (no redirect). Revalidates feed. Used by write page. */
export async function composePostAction(params: {
  title?: string;
  content: string;
  category?: PostCategory;
  visibility?: Visibility;
  tags?: string[];
  youtubeUrl?: string;
  mediaUrls?: string[];
  subscribersOnly?: boolean;
  aiSummary?: string | null;
  aiDescription?: string | null;
  aiTags?: string[];
}): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  logInfo("SERVER_ACTION", "composePostAction(write) start", {
    hasContent: params.content.trim().length > 0,
    category: params.category ?? "GENERAL",
    visibility: params.visibility ?? "MEMBERS",
    hasTags: !!params.tags && params.tags.length > 0,
  });
  const session = await getSession();
  if (!session) {
    logWarn("SERVER_ACTION", "composePostAction(write) session null");
    return { ok: false, error: "로그인이 필요합니다. 새로고침 후 다시 시도해주세요." };
  }
  const trimmed = params.content.trim();
  if (!trimmed) return { ok: false, error: "내용을 입력해주세요" };
  try {
    await assertRateLimit({
      userId: session.userId,
      action: "CREATE_POST",
      maxPerMinute: 15,
      maxPer10Min: 50,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logWarn("SERVER_ACTION", "composePostAction(write) rate limit or error", { userId: session.userId, rawMessage: msg });
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Rate limit or server error" };
  }
  const rawTags = params.tags ?? [];
  // SHORTS posts always carry the "shorts" tag server-side
  if (params.category === "SHORTS" && !rawTags.includes("shorts")) {
    rawTags.unshift("shorts");
  }
  const tags = [...new Set(rawTags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 5);
  try {
    const post = await createPost({
      authorId: session.userId,
      category: params.category ?? "GENERAL",
      content: trimmed,
      visibility: params.visibility ?? "PUBLIC",
      tags,
      youtubeUrl: params.youtubeUrl || null,
      mediaUrls: params.mediaUrls ?? [],
      subscribersOnly: params.subscribersOnly ?? false,
      aiSummary: params.aiSummary ?? null,
      aiDescription: params.aiDescription ?? null,
      aiTags: params.aiTags,
    });
    logInfo("SERVER_ACTION", "composePostAction(write) success", {
      userId: session.userId,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });
    revalidatePath("/feed");
    revalidatePath("/home");
    revalidatePath("/shorts");
    return { ok: true, postId: post.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const display = (msg && msg.trim() !== "") ? msg : "Failed to create post (check server logs)";
    logError("SERVER_ACTION", "composePostAction(write) createPost error", {
      userId: session.userId,
      error: display,
    });
    return { ok: false, error: display };
  }
}

/**
 * Fetch YouTube video metadata from a YouTube URL or video ID.
 * Requires YOUTUBE_API_KEY env var. Safe to call without it (returns ok:false).
 * Called before AI generation to get title/description as context.
 */
export async function fetchYouTubeMetadataAction(
  youtubeUrlOrId: string
): Promise<{ ok: true; data: YouTubeMetadata } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };

  const trimmed = youtubeUrlOrId.trim();
  if (!trimmed) return { ok: false, error: "No URL provided" };

  // Accept either a full URL or a bare 11-char video ID
  let videoId: string;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  } else {
    const parsed = parseYouTubeUrl(trimmed);
    if (!parsed.isValid) return { ok: false, error: parsed.error };
    videoId = parsed.videoId;
  }

  return fetchYouTubeMetadata(videoId);
}

/**
 * Fetch transcript for a YouTube URL or bare video ID.
 * Returns ok:false gracefully if captions are unavailable.
 * Caller should fall back to fetchYouTubeMetadataAction for AI context.
 */
export async function fetchYouTubeTranscriptAction(
  youtubeUrlOrId: string
): Promise<TranscriptFetchResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };

  const trimmed = youtubeUrlOrId.trim();
  if (!trimmed) return { ok: false, error: "No URL provided" };

  let videoId: string;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  } else {
    const parsed = parseYouTubeUrl(trimmed);
    if (!parsed.isValid) return { ok: false, error: parsed.error };
    videoId = parsed.videoId;
  }

  return fetchYouTubeTranscript(videoId);
}
