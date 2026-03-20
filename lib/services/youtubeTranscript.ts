/**
 * Server-side YouTube transcript fetcher.
 * Primary: YouTube InnerTube API (no key required, reliable JSON).
 * Fallback: Watch page scraping (ytInitialPlayerResponse).
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

// ── InnerTube API ──────────────────────────────────────────────────────────

// Public InnerTube key embedded in YouTube's web app
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

async function fetchCaptionTracksViaInnerTube(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20230901.04.00",
              hl: "ko",
            },
          },
        }),
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return { tracks: [], error: `InnerTube ${res.status}` };
    const data = (await res.json()) as {
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: CaptionTrack[];
        };
      };
    };
    const tracks =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    return { tracks };
  } catch (e) {
    return {
      tracks: [],
      error: `InnerTube failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ── Page scraping fallback ──────────────────────────────────────────────────

const WATCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

/** Extract the JSON object for `key` from inline script using bracket-depth counting. */
function extractJsonObject(html: string, key: string): unknown | null {
  const keyIdx = html.indexOf(`${key}=`);
  if (keyIdx === -1) return null;
  const start = html.indexOf("{", keyIdx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") { depth++; continue; }
    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

async function fetchCaptionTracksViaPage(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: WATCH_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return { tracks: [], error: `Watch page ${res.status}` };
    html = await res.text();
  } catch (e) {
    return {
      tracks: [],
      error: `Fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const playerResponse = extractJsonObject(html, "ytInitialPlayerResponse");
  if (!playerResponse)
    return { tracks: [], error: "ytInitialPlayerResponse not found" };

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

// ── Combined fetch ─────────────────────────────────────────────────────────

async function fetchCaptionTracks(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  const innertube = await fetchCaptionTracksViaInnerTube(videoId);
  if (innertube.tracks.length > 0) return innertube;

  // Fallback to page scraping
  const page = await fetchCaptionTracksViaPage(videoId);
  if (page.tracks.length > 0) return page;

  return {
    tracks: [],
    error: innertube.error ?? page.error ?? "No caption tracks available",
  };
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

async function fetchTimedTextJson(
  baseUrl: string
): Promise<TimedTextEvent[] | null> {
  try {
    // Force JSON3 format
    const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
    const res = await fetch(url, {
      headers: WATCH_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { events?: TimedTextEvent[] };
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
    .replace(/\[.*?\]/g, "") // strip [Music], [Applause] etc.
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
    return {
      ok: false,
      error: "Transcript text was empty after normalisation",
    };
  }

  return {
    ok: true,
    transcriptText,
    source: track.kind === "asr" ? "auto" : "manual",
    languageCode: track.languageCode ?? "unknown",
  };
}
