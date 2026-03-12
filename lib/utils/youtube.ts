/**
 * YouTube URL parsing utilities.
 *
 * Supported input formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 */

/** Extract YouTube video ID from any supported URL. Returns null if not a valid YouTube URL. */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      // https://youtu.be/VIDEO_ID
      const id = u.pathname.slice(1).split(/[/?#]/)[0];
      return id || null;
    }
    if (host === "youtube.com") {
      if (u.pathname.startsWith("/shorts/")) {
        // https://www.youtube.com/shorts/VIDEO_ID
        return u.pathname.split("/")[2] ?? null;
      }
      if (u.pathname.startsWith("/embed/")) {
        // https://www.youtube.com/embed/VIDEO_ID
        return u.pathname.split("/")[2] ?? null;
      }
      // https://www.youtube.com/watch?v=VIDEO_ID
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
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
