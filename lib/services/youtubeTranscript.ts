/**
 * Server-side YouTube transcript fetcher.
 *
 * Strategy (tries in order until tracks are found):
 *  1. InnerTube WEB / ANDROID / TVHTML5 — structured player response
 *  2. Watch-page scraping               — ytInitialPlayerResponse in HTML
 *  3. Timedtext list API                — /api/timedtext?type=list (XML, separate service)
 *  4. Timedtext direct guess            — try /api/timedtext?lang=ko|en directly
 *
 * Strategies 3 & 4 bypass the player API entirely and hit YouTube's older
 * caption service, which is less likely to be restricted by server IP.
 *
 * Never call from client components — server-side only.
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
  languageCode?: string;
  kind?: string; // "asr" = auto-generated
}

interface TimedTextEvent {
  tStartMs?: number;
  segs?: Array<{ utf8?: string }>;
}

// ── Shared headers ─────────────────────────────────────────────────────────

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  // Bypass Google's consent gate — server IPs frequently hit this
  "Cookie": "CONSENT=YES+cb; SOCS=CAESEwgDEgk0OTI1NjI4NTkaAmtvIAEaBgiA_LyeBg",
};

// ══════════════════════════════════════════════════════════════════════════
// Strategy 1 — InnerTube player API
// ══════════════════════════════════════════════════════════════════════════

const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player";
const INNERTUBE_HEADERS = {
  ...HEADERS,
  "Content-Type": "application/json",
  "Origin": "https://www.youtube.com",
  "Referer": "https://www.youtube.com/",
  "X-YouTube-Client-Name": "1",
  "X-YouTube-Client-Version": "2.20240101.00.00",
};

async function innerTubeRequest(
  videoId: string,
  clientName: string,
  clientVersion: string,
  extra: Record<string, unknown> = {}
): Promise<CaptionTrack[]> {
  try {
    const res = await fetch(INNERTUBE_URL, {
      method: "POST",
      headers: INNERTUBE_HEADERS,
      body: JSON.stringify({
        videoId,
        context: { client: { clientName, clientVersion, hl: "ko", gl: "KR", ...extra } },
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json() as {
      captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
    };
    return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  } catch {
    return [];
  }
}

async function strategy1_InnerTube(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  let tracks = await innerTubeRequest(videoId, "WEB", "2.20240101.00.00");
  if (tracks.length > 0) return { tracks };

  tracks = await innerTubeRequest(videoId, "ANDROID", "17.31.35", {
    androidSdkVersion: 30,
    userAgent: "com.google.android.youtube/17.31.35 (Linux; U; Android 11) gzip",
  });
  if (tracks.length > 0) return { tracks };

  tracks = await innerTubeRequest(videoId, "TVHTML5", "7.20240101.08.00");
  if (tracks.length > 0) return { tracks };

  return { tracks: [], error: "InnerTube: no caption tracks in any client response" };
}

// ══════════════════════════════════════════════════════════════════════════
// Strategy 2 — Watch-page scraping
// ══════════════════════════════════════════════════════════════════════════

function extractJsonObject(html: string, key: string): unknown | null {
  const idx = html.indexOf(key);
  if (idx === -1) return null;
  const start = html.indexOf("{", idx);
  if (start === -1) return null;

  let depth = 0, inString = false, escape = false;
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

async function strategy2_PageScraping(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  let html: string;
  try {
    const res = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US&has_verified=1`,
      { headers: HEADERS, cache: "no-store" }
    );
    if (!res.ok) return { tracks: [], error: `Watch page ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { tracks: [], error: `Page fetch: ${e instanceof Error ? e.message : String(e)}` };
  }

  const playerResponse =
    extractJsonObject(html, "ytInitialPlayerResponse=") ??
    extractJsonObject(html, "ytInitialPlayerResponse =") ??
    extractJsonObject(html, "PLAYER_RESPONSE");

  if (!playerResponse) {
    const isConsent = html.includes("consent.youtube.com");
    return { tracks: [], error: `Page scraping: ${isConsent ? "consent wall" : "player response not found"}` };
  }

  const tracks: CaptionTrack[] =
    (playerResponse as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } } })
      ?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  return tracks.length > 0 ? { tracks } : { tracks: [], error: "Page scraping: no caption tracks" };
}

// ══════════════════════════════════════════════════════════════════════════
// Strategy 3 — Timedtext list XML API (separate service, less restricted)
// ══════════════════════════════════════════════════════════════════════════

async function strategy3_TimedtextList(videoId: string): Promise<{ tracks: CaptionTrack[]; error?: string }> {
  const buildListUrl = (asrs: boolean) =>
    `https://www.youtube.com/api/timedtext?v=${videoId}&type=list${asrs ? "&asrs=1" : ""}`;

  const langs: Array<{ lang: string; kind?: string }> = [];

  // Fetch manual captions list
  try {
    const res = await fetch(buildListUrl(false), { headers: HEADERS, cache: "no-store" });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/lang_code="([^"]+)"/g)) {
        langs.push({ lang: m[1]! });
      }
    }
  } catch { /* ignore */ }

  // Fetch auto-generated captions list
  try {
    const res = await fetch(buildListUrl(true), { headers: HEADERS, cache: "no-store" });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/lang_code="([^"]+)"/g)) {
        if (!langs.find((l) => l.lang === m[1] && l.kind === "asr")) {
          langs.push({ lang: m[1]!, kind: "asr" });
        }
      }
    }
  } catch { /* ignore */ }

  if (langs.length === 0) return { tracks: [], error: "Timedtext list: no languages found" };

  const tracks: CaptionTrack[] = langs.map(({ lang, kind }) => ({
    baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}${kind === "asr" ? "&kind=asr" : ""}`,
    languageCode: lang,
    kind,
  }));

  return { tracks };
}

// ══════════════════════════════════════════════════════════════════════════
// Strategy 4 — Direct timedtext guess (no discovery step)
// ══════════════════════════════════════════════════════════════════════════

async function strategy4_DirectGuess(videoId: string): Promise<TranscriptFetchResult> {
  const candidates: CaptionTrack[] = [
    { baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=ko`, languageCode: "ko" },
    { baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=ko&kind=asr`, languageCode: "ko", kind: "asr" },
    { baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`, languageCode: "en" },
    { baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`, languageCode: "en", kind: "asr" },
    { baseUrl: `https://video.google.com/timedtext?v=${videoId}&lang=ko`, languageCode: "ko" },
    { baseUrl: `https://video.google.com/timedtext?v=${videoId}&lang=en`, languageCode: "en" },
  ];

  for (const track of candidates) {
    const result = await fetchTrackContent(track);
    if (result) return result;
  }

  return { ok: false, error: "Direct timedtext guess: no captions found" };
}

// ══════════════════════════════════════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════════════════════════════════════

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

async function fetchTrackContent(track: CaptionTrack): Promise<TranscriptResult | null> {
  try {
    const url = track.baseUrl.includes("fmt=") ? track.baseUrl : `${track.baseUrl}&fmt=json3`;
    const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json() as { events?: TimedTextEvent[] };
    const events = body.events;
    if (!events?.length) return null;
    const transcriptText = eventsToText(events);
    if (!transcriptText) return null;
    return {
      ok: true,
      transcriptText,
      source: track.kind === "asr" ? "auto" : "manual",
      languageCode: track.languageCode ?? "unknown",
    };
  } catch {
    return null;
  }
}

function eventsToText(events: TimedTextEvent[]): string {
  return events
    .flatMap((e) => e.segs?.map((s) => s.utf8 ?? "") ?? [])
    .join(" ")
    .replace(/\[.*?\]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ══════════════════════════════════════════════════════════════════════════
// Public API
// ══════════════════════════════════════════════════════════════════════════

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptFetchResult> {
  if (!videoId) return { ok: false, error: "No video ID" };

  const errors: string[] = [];

  // Strategies 1 & 2: discover tracks via player API, then fetch content
  for (const strategy of [strategy1_InnerTube, strategy2_PageScraping]) {
    const { tracks, error } = await strategy(videoId);
    if (error) errors.push(error);
    if (tracks.length === 0) continue;

    const track = pickTrack(tracks);
    if (!track?.baseUrl) continue;

    const result = await fetchTrackContent(track);
    if (result) return result;
    errors.push(`Track fetch failed for ${track.languageCode}`);
  }

  // Strategy 3: timedtext list API (completely separate YouTube service)
  {
    const { tracks, error } = await strategy3_TimedtextList(videoId);
    if (error) errors.push(error);
    if (tracks.length > 0) {
      const track = pickTrack(tracks);
      if (track?.baseUrl) {
        const result = await fetchTrackContent(track);
        if (result) return result;
      }
    }
  }

  // Strategy 4: direct URL guessing — last resort
  const direct = await strategy4_DirectGuess(videoId);
  if (direct.ok) return direct;
  if (!direct.ok) errors.push(direct.error);

  return { ok: false, error: errors.join(" | ") };
}
