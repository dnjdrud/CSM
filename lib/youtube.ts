/**
 * YouTube URL → video ID extraction. Store only the 11-char ID in DB, not full URL.
 */

const VIDEO_ID_LEN = 11;
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract YouTube video ID from URL or string.
 * Supports: watch?v=, youtu.be/, embed/
 * Returns null if not found or invalid (length !== 11).
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (VIDEO_ID_REGEX.test(trimmed)) return trimmed;

    if (trimmed.includes("youtube.com/watch")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID_REGEX.test(v)) return v;
      return null;
    }

    if (trimmed.includes("youtu.be/")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const seg = url.pathname.slice(1).split("/")[0];
      const id = seg?.split("?")[0];
      if (id && VIDEO_ID_REGEX.test(id)) return id;
      return null;
    }

    if (trimmed.includes("youtube.com/embed/")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const seg = url.pathname.split("/embed/")[1];
      const id = seg?.split("/")[0]?.split("?")[0];
      if (id && VIDEO_ID_REGEX.test(id)) return id;
      return null;
    }

    return null;
  } catch {
    return null;
  }
}
