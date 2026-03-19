/**
 * YouTube URL parsing utilities.
 *
 * Supported input formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://www.youtube.com/watch?v=VIDEO_ID&t=42s   (extra params ignored)
 *   https://youtu.be/VIDEO_ID
 *   https://youtu.be/VIDEO_ID?t=42
 *   https://youtube.com/watch?v=VIDEO_ID             (no www)
 *   https://m.youtube.com/watch?v=VIDEO_ID           (mobile)
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *
 * Test examples:
 *   parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")
 *   // { isValid: true, videoId: "dQw4w9WgXcQ", normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
 *
 *   parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")
 *   // { isValid: true, videoId: "dQw4w9WgXcQ", normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
 *
 *   parseYouTubeUrl("https://example.com/video")
 *   // { isValid: false, error: "Not a YouTube URL" }
 *
 *   parseYouTubeUrl("")
 *   // { isValid: false, error: "Empty input" }
 */

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function isYouTubeHost(hostname: string): boolean {
  // strips www. and m. prefixes
  const h = hostname.replace(/^(www\.|m\.)/, "");
  return h === "youtube.com";
}

export type YouTubeParseResult =
  | { isValid: true; videoId: string; normalizedUrl: string }
  | { isValid: false; videoId?: never; normalizedUrl?: never; error: string };

/**
 * Parse any YouTube URL and return a structured result.
 * Safe to call with any string — never throws.
 */
export function parseYouTubeUrl(raw: string): YouTubeParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { isValid: false, error: "Empty input" };

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return { isValid: false, error: "Not a valid URL" };
  }

  let videoId: string | null = null;

  if (u.hostname === "youtu.be") {
    // https://youtu.be/VIDEO_ID[?t=42]
    videoId = u.pathname.slice(1).split(/[/?#]/)[0] ?? null;
  } else if (isYouTubeHost(u.hostname)) {
    if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/")[2] ?? null;
    } else if (u.pathname.startsWith("/embed/")) {
      videoId = u.pathname.split("/")[2] ?? null;
    } else {
      // /watch or bare path
      videoId = u.searchParams.get("v");
    }
  } else {
    return { isValid: false, error: "Not a YouTube URL" };
  }

  if (!videoId || !YT_ID_RE.test(videoId)) {
    return { isValid: false, error: "Could not extract a valid video ID" };
  }

  return {
    isValid: true,
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/** Extract YouTube video ID from any supported URL. Returns null if not a valid YouTube URL. */
export function extractYouTubeVideoId(url: string): string | null {
  const result = parseYouTubeUrl(url);
  return result.isValid ? result.videoId : null;
}

/** Returns true if the URL is a valid YouTube link with a parseable video ID. */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Convert any supported YouTube URL to the embed URL.
 * Returns null if the URL is not a valid YouTube link.
 */
export function toYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

/**
 * Returns the highest-quality thumbnail URL for a given YouTube video URL.
 * Falls back to mqdefault (320×180) which is always available.
 * Returns null if the URL is not valid.
 */
export function toYouTubeThumbnailUrl(
  url: string,
  quality: "default" | "mqdefault" | "hqdefault" | "sddefault" | "maxresdefault" = "mqdefault"
): string | null {
  const id = extractYouTubeVideoId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}
