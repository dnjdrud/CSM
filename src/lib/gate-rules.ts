// Shared numbers + pure checks for the entry gate. Safe for client and server.

export const GATE_LIMITS = {
  /** Only guards against an accidental tap; does not check what was said. */
  minRecordMs: 1000,
  /** Recording stops itself after this, to keep memory bounded. */
  maxRecordMs: 60_000,
  /** Recorded blobs smaller than this are treated as empty. */
  minBlobBytes: 200,
  attemptTtlMs: 15 * 60_000,
  grantTtlMs: 60 * 60_000,
  /** Fraction of the theoretical minimum time we require (clock jitter, encoder delay). */
  elapsedTolerance: 0.8,
} as const;

export type PlaybackReport = {
  /** Wall-clock length of the recording, measured while recording. */
  recordedMs: number;
  /**
   * Time the element was actually playing: from "playing" until "waiting"/"pause"/"ended",
   * summed. Buffering (waiting) is NOT counted as listening.
   */
  playedMs: number;
  /** media currentTime (s) when playback first started; must be ~0 (from the beginning). */
  startPos: number;
  /** media currentTime (s) at "ended". */
  endPos: number;
  /** media duration (s); may be Infinity/NaN for some recorder formats. */
  duration: number;
  /** currentTime went backwards or advanced faster than the time spent playing. */
  jumped: boolean;
  /** A seeking event happened during playback (we never seek ourselves after start). */
  seeked: boolean;
  /** playbackRate / defaultPlaybackRate differed from 1 at any point. */
  rateChanged: boolean;
  /** The media element reported ended. */
  ended: boolean;
};

/** Allowed slack: encoder padding, timer resolution, recorder start latency. */
export const requiredMs = (recordedMs: number) => recordedMs * 0.85 - 300;

/**
 * Decide whether a playback counts as "played to the end".
 * `ended` alone is not enough: playback must have started at the beginning, progressed
 * continuously (no seek/jump, normal speed), actually played for about the recording's
 * length (buffering excluded), and the media position must have reached the end.
 * This is a client-side check and can be bypassed by a modified browser. It does not
 * show that anyone listened, or what was said.
 */
export function evaluatePlayback(r: PlaybackReport): { ok: true } | { ok: false; reason: string } {
  if (!r.ended) return { ok: false, reason: "not_ended" };
  if (r.seeked) return { ok: false, reason: "seeked" };
  if (r.rateChanged) return { ok: false, reason: "rate" };
  if (r.jumped) return { ok: false, reason: "jumped" };
  if (!(r.startPos <= 0.3)) return { ok: false, reason: "not_from_start" };
  const need = requiredMs(r.recordedMs);
  if (r.playedMs < need) return { ok: false, reason: "too_short" };
  if (!Number.isFinite(r.endPos) || r.endPos * 1000 < need) return { ok: false, reason: "end_not_reached" };
  if (Number.isFinite(r.duration) && r.duration > 0 && r.endPos < r.duration - 0.5) return { ok: false, reason: "end_not_reached" };
  return { ok: true };
}

/**
 * Continuity check for one timeupdate step: media time may not go backwards and may not
 * advance much faster than the time actually spent playing (catches skips that bypass
 * "seeking", e.g. a scripted currentTime jump in some engines).
 */
export function isJump(prevPos: number, pos: number, playedDeltaMs: number): boolean {
  const mediaDelta = pos - prevPos;
  if (mediaDelta < -0.05) return true;
  return mediaDelta > (playedDeltaMs / 1000) * 1.5 + 0.75;
}
