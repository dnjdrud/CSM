/**
 * Server-side YouTube transcript fetcher.
 * Uses YouTube's internal timedtext API — no third-party packages required.
 *
 * Flow:
 *   1. Fetch the watch page for the video
 *   2. Extract ytInitialPlayerResponse JSON from the HTML
 *   3. Pull the first available caption track URL
 *   4. Fetch the timed-text JSON and merge segments into plain text
 *
 * Prefer Korean (ko) captions, fall back to English (en), then first available.
 *
 * Never call from client components — runs server-side only.
 */

export interface TranscriptResult {
  ok: true;
  transcriptText: string;
  /** "auto" = auto-generated captions, "manual" = creator-uploaded */
  source: "auto" | "manual";
  languageCode: string;
}

export type TranscriptFetchResult =
  | TranscriptResult
  | { ok: false; error: string };

// ── Internal types ─────────────────────────────────────────────────────────

interface CaptionTrack {
  baseUrl: string;
  name?: { simpleText?: string };
  vssId?: string;
  languageCode?: string;
  kind?: string; // "asr" = auto-generated
}

interface TimedTextEvent {
  tStartMs?: number;
  segs?: Array<{ utf8?: string }>;
}

// ── Page scraping ──────────────────────────────────────────────────────────

const WATCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

async function fetchCaptionTracks(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: WATCH_HEADERS,
      next: { revalidate: 0 }, // no cache — fresh page each time
    });
    if (!res.ok) return { tracks: [], error: `Watch page ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { tracks: [], error: `Fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Extract ytInitialPlayerResponse JSON from the inline script
  const firstMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});(?:\s*var\s|\s*<\/script>)/);
  const fallbackMatch = firstMatch?.[1]
    ? null
    : html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/);
  const capturedJson = firstMatch?.[1] ?? fallbackMatch?.[1];
  if (!capturedJson) return { tracks: [], error: "ytInitialPlayerResponse not found" };

  let playerResponse: unknown;
  try {
    playerResponse = JSON.parse(capturedJson);
  } catch {
    return { tracks: [], error: "Failed to parse ytInitialPlayerResponse" };
  }

  const tracks: CaptionTrack[] =
    (
      playerResponse as {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks?: CaptionTrack[];
          };
        };
      }
    )?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  return { tracks };
}

// ── Track selection ────────────────────────────────────────────────────────

const PREFERRED_LANGS = ["ko", "en"];

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  for (const lang of PREFERRED_LANGS) {
    // Prefer manual (creator-uploaded) captions first
    const manual = tracks.find(
      (t) => t.languageCode === lang && t.kind !== "asr"
    );
    if (manual) return manual;
    // Then accept auto-generated
    const auto = tracks.find((t) => t.languageCode === lang);
    if (auto) return auto;
  }
  return tracks[0]!;
}

// ── Timed-text fetching ────────────────────────────────────────────────────

async function fetchTimedTextJson(baseUrl: string): Promise<TimedTextEvent[] | null> {
  try {
    // Force JSON3 format
    const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
    const res = await fetch(url, {
      headers: WATCH_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const body = await res.json() as { events?: TimedTextEvent[] };
    return body.events ?? null;
  } catch {
    return null;
  }
}

// ── Text normalisation ─────────────────────────────────────────────────────

function eventsToText(events: TimedTextEvent[]): string {
  return events
    .flatMap((e) => e.segs?.map((s) => s.utf8 ?? "") ?? [])
    .join(" ")
    .replace(/\[.*?\]/g, "")       // strip [Music], [Applause] etc.
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch and return the full transcript text for a YouTube video.
 *
 * @example
 * const result = await fetchYouTubeTranscript("dQw4w9WgXcQ");
 * if (result.ok) {
 *   console.log(result.transcriptText); // "We're no strangers to love..."
 *   console.log(result.source);         // "auto"
 * }
 */
export async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptFetchResult> {
  if (!videoId) return { ok: false, error: "No video ID" };

  const { tracks, error: tracksError } = await fetchCaptionTracks(videoId);

  if (tracks.length === 0) {
    return { ok: false, error: tracksError ?? "No caption tracks available" };
  }

  const track = pickTrack(tracks);
  if (!track?.baseUrl) {
    return { ok: false, error: "No usable caption track found" };
  }

  const events = await fetchTimedTextJson(track.baseUrl);
  if (!events || events.length === 0) {
    return { ok: false, error: "Empty transcript" };
  }

  const transcriptText = eventsToText(events);
  if (!transcriptText) {
    return { ok: false, error: "Transcript text was empty after normalisation" };
  }

  return {
    ok: true,
    transcriptText,
    source: track.kind === "asr" ? "auto" : "manual",
    languageCode: track.languageCode ?? "unknown",
  };
}
