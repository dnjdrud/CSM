/**
 * Server-side YouTube transcript fetcher.
 *
 * Strategy (tries in order until tracks are found):
 *  1. InnerTube WEB client  — most data, best caption coverage
 *  2. InnerTube ANDROID client — bypasses some restrictions WEB hits
 *  3. Watch-page scraping — last resort, works when InnerTube is blocked
 *
 * Never call from client components — runs server-side only.
 */

export interface TranscriptResult {
  ok: true;
  transcriptText: string;
  source: "auto" | "manual";
  languageCode: string;
}
export type TranscriptFetchResult = TranscriptResult | { ok: false; error: string };

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

type InnerTubeResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
};

// ── InnerTube helpers ──────────────────────────────────────────────────────

// No key param — current YouTube API no longer requires it server-side
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player";

const INNERTUBE_HEADERS = {
  "Content-Type": "application/json",
  "Origin": "https://www.youtube.com",
  "Referer": "https://www.youtube.com/",
  "X-YouTube-Client-Name": "1",
  "X-YouTube-Client-Version": "2.20240101.00.00",
};

function makeBody(videoId: string, clientName: string, clientVersion: string, extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    videoId,
    context: {
      client: { clientName, clientVersion, hl: "ko", gl: "KR", ...extra },
    },
  });
}

async function innerTubeRequest(videoId: string, clientName: string, clientVersion: string, extra?: Record<string, unknown>): Promise<CaptionTrack[]> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: "POST",
      headers: INNERTUBE_HEADERS,
      body: makeBody(videoId, clientName, clientVersion, extra),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as InnerTubeResponse;
    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  } catch {
    return [];
  }
}

async function fetchCaptionTracksViaInnerTube(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  // 1a. WEB client
  let tracks = await innerTubeRequest(videoId, "WEB", "2.20240101.00.00");
  if (tracks.length > 0) return { tracks };

  // 1b. ANDROID client — often returns captions when WEB is blocked
  tracks = await innerTubeRequest(videoId, "ANDROID", "17.31.35", {
    androidSdkVersion: 30,
    userAgent: "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip",
  });
  if (tracks.length > 0) return { tracks };

  // 1c. TVHTML5 client — minimal auth requirements
  tracks = await innerTubeRequest(videoId, "TVHTML5", "7.20240101.08.00");
  if (tracks.length > 0) return { tracks };

  return { tracks: [], error: "InnerTube: no caption tracks in any client response" };
}

// ── Watch-page scraping fallback ───────────────────────────────────────────

const PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  // English to avoid region-specific consent / cookie walls
  "Accept-Language": "en-US,en;q=0.9",
  // Bypass Google consent gate that server IPs often hit
  "Cookie": "CONSENT=YES+cb; SOCS=CAESEwgDEgk0OTI1NjI4NTkaAmtvIAEaBgiA_LyeBg; GPS=1",
};

/** Extract a JSON object by its assignment key using bracket-depth parsing. */
function extractJsonObject(html: string, key: string): unknown | null {
  // Try both `key = ` and `key=` forms
  const idx = html.indexOf(`"${key}"`) !== -1
    ? html.indexOf(`"${key}"`)
    : html.indexOf(key);
  if (idx === -1) return null;

  const start = html.indexOf("{", idx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i]!;
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

async function fetchCaptionTracksViaPage(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  let html: string;
  try {
    const res = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US&has_verified=1`,
      { headers: PAGE_HEADERS, cache: "no-store" }
    );
    if (!res.ok) return { tracks: [], error: `Watch page ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { tracks: [], error: `Page fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Try multiple keys — YouTube embeds the player response under different names
  const playerResponse =
    extractJsonObject(html, "ytInitialPlayerResponse") ??
    extractJsonObject(html, "PLAYER_RESPONSE") ??
    extractJsonObject(html, "playerResponse");

  if (!playerResponse) {
    // Detect common failure modes for a more useful error
    const isConsent = html.includes("consent.youtube.com") || html.includes("CONSENT");
    const isBotCheck = html.includes("Sorry, something went wrong") || html.includes("recaptcha");
    const reason = isConsent ? "consent wall" : isBotCheck ? "bot check" : "player data not found in page";
    return { tracks: [], error: `Page scraping: ${reason}` };
  }

  const tracks: CaptionTrack[] =
    (playerResponse as InnerTubeResponse)?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  return tracks.length > 0 ? { tracks } : { tracks: [], error: "Page scraping: no caption tracks" };
}

// ── Combined fetch ─────────────────────────────────────────────────────────

async function fetchCaptionTracks(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  const innertube = await fetchCaptionTracksViaInnerTube(videoId);
  if (innertube.tracks.length > 0) return innertube;

  const page = await fetchCaptionTracksViaPage(videoId);
  if (page.tracks.length > 0) return page;

  return { tracks: [], error: [innertube.error, page.error].filter(Boolean).join(" | ") };
}

// ── Track selection ────────────────────────────────────────────────────────

const PREFERRED_LANGS = ["ko", "en"];

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  for (const lang of PREFERRED_LANGS) {
    const manual = tracks.find((t) => t.languageCode === lang && t.kind !== "asr");
    if (manual) return manual;
    const auto = tracks.find((t) => t.languageCode === lang);
    if (auto) return auto;
  }
  return tracks[0]!;
}

// ── Timed-text fetching ────────────────────────────────────────────────────

async function fetchTimedTextJson(baseUrl: string): Promise<TimedTextEvent[] | null> {
  try {
    const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
    const res = await fetch(url, { headers: PAGE_HEADERS, cache: "no-store" });
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
    .replace(/\[.*?\]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptFetchResult> {
  if (!videoId) return { ok: false, error: "No video ID" };

  const { tracks, error: tracksError } = await fetchCaptionTracks(videoId);
  if (tracks.length === 0) return { ok: false, error: tracksError ?? "No caption tracks available" };

  const track = pickTrack(tracks);
  if (!track?.baseUrl) return { ok: false, error: "No usable caption track found" };

  const events = await fetchTimedTextJson(track.baseUrl);
  if (!events || events.length === 0) return { ok: false, error: "Empty transcript" };

  const transcriptText = eventsToText(events);
  if (!transcriptText) return { ok: false, error: "Transcript text was empty after normalisation" };

  return {
    ok: true,
    transcriptText,
    source: track.kind === "asr" ? "auto" : "manual",
    languageCode: track.languageCode ?? "unknown",
  };
}
