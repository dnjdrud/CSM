/**
 * Server-side YouTube Data API v3 metadata fetcher.
 * Requires: YOUTUBE_API_KEY in environment.
 *
 * Never import this from client components — it reads server env vars.
 */

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
}

export type YouTubeMetadataResult =
  | { ok: true; data: YouTubeMetadata }
  | { ok: false; error: string };

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Fetch YouTube video metadata by video ID.
 * Returns ok:false if API key is missing or the request fails.
 *
 * Usage:
 *   const result = await fetchYouTubeMetadata("dQw4w9WgXcQ");
 *   if (result.ok) console.log(result.data.title);
 */
export async function fetchYouTubeMetadata(
  videoId: string
): Promise<YouTubeMetadataResult> {
  if (!videoId) return { ok: false, error: "No video ID provided" };

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { ok: false, error: "YOUTUBE_API_KEY not configured" };

  const url = new URL(`${YT_API_BASE}/videos`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("id", videoId);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", "1");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      // Cache for 1 hour — metadata rarely changes
      next: { revalidate: 3600 },
    });
  } catch (e) {
    return { ok: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!res.ok) {
    return { ok: false, error: `YouTube API error: ${res.status} ${res.statusText}` };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "Failed to parse YouTube API response" };
  }

  const item = (body as { items?: unknown[] })?.items?.[0] as {
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
  } | undefined;

  if (!item?.snippet) {
    return { ok: false, error: "Video not found or not accessible" };
  }

  const { snippet } = item;
  const thumbnailUrl =
    snippet.thumbnails?.high?.url ??
    snippet.thumbnails?.medium?.url ??
    snippet.thumbnails?.default?.url ??
    null;

  return {
    ok: true,
    data: {
      videoId,
      title: snippet.title ?? "",
      description: snippet.description ?? "",
      channelTitle: snippet.channelTitle ?? "",
      thumbnailUrl,
      publishedAt: snippet.publishedAt ?? null,
    },
  };
}
