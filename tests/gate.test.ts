import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_GATE, gateReducer, type GateEvent, type GateState } from "@/lib/gate-machine";
import { needsGrantToCreate } from "@/lib/entry-rules";
import { GATE_LIMITS, evaluatePlayback, isJump } from "@/lib/gate-rules";
import { __useMemoryDbForTests } from "@/server/db";
import { createAttempt, enterRoom, leaveVisit, revokeSession, verifyGrant } from "@/server/room-access";
import { recordSession } from "@/server/session-store";

const run = (events: GateEvent[], from: GateState = INITIAL_GATE) => events.reduce(gateReducer, from);
const HAPPY: GateEvent[] = [
  { t: "PRELUDE_DONE" },
  { t: "REQUEST_MIC" },
  { t: "MIC_READY", at: 0 },
  { t: "RECORDED", recordedMs: 3000 },
  { t: "PLAY" },
  { t: "PLAY_DONE" },
  { t: "CONFIRM" },
  { t: "ENTERED" },
];

describe("gate state machine", () => {
  it("follows prelude -> ... -> room in order", () => {
    const seen = HAPPY.reduce<GateState[]>((acc, e) => [...acc, gateReducer(acc[acc.length - 1], e)], [INITIAL_GATE]);
    expect(seen.map((s) => s.s)).toEqual([
      "prelude", "ready", "requestingPermission", "recording", "recorded", "playing", "listened", "confirmed", "room",
    ]);
  });

  it("cannot skip steps", () => {
    expect(run([{ t: "PRELUDE_DONE" }, { t: "CONFIRM" }]).s).toBe("ready");
    expect(run([{ t: "PRELUDE_DONE" }, { t: "ENTERED" }]).s).toBe("ready");
    expect(run(HAPPY.slice(0, 4).concat({ t: "CONFIRM" })).s).toBe("recorded"); // not listened yet
    expect(run(HAPPY.slice(0, 5).concat({ t: "CONFIRM" })).s).toBe("playing"); // still playing
    expect(run([{ t: "REQUEST_MIC" }]).s).toBe("prelude"); // prelude first
  });

  it("re-recording drops listened / confirmed", () => {
    expect(run(HAPPY.slice(0, 6).concat({ t: "RERECORD" })).s).toBe("ready");
    const after = run(HAPPY.slice(0, 6).concat({ t: "RERECORD" }, { t: "CONFIRM" }));
    expect(after.s).toBe("ready");
  });

  it("interrupted or failed playback means listening again from the start", () => {
    const s = run(HAPPY.slice(0, 5).concat({ t: "PLAY_STOPPED", error: "play_interrupted" }));
    expect(s).toMatchObject({ s: "recorded", error: "play_interrupted" });
    expect(run([{ t: "CONFIRM" }], s).s).toBe("recorded");
    const f = run(HAPPY.slice(0, 5).concat({ t: "PLAY_STOPPED", error: "play_failed" }));
    expect(f.s).toBe("recorded");
  });

  it("mic failures only allow retry (back to ready)", () => {
    for (const error of ["denied", "no_device", "busy", "unsupported", "insecure"] as const) {
      const s = run([{ t: "PRELUDE_DONE" }, { t: "REQUEST_MIC" }, { t: "FAIL", error }]);
      expect(s).toEqual({ s: "ready", error });
      expect(run([{ t: "CONFIRM" }, { t: "ENTERED" }], s).s).toBe("ready");
    }
  });

  it("server refusal requires a fresh recording; reset forgets everything", () => {
    expect(run(HAPPY.slice(0, 7).concat({ t: "ENTER_FAILED", error: "server" })).s).toBe("ready");
    expect(run(HAPPY.concat({ t: "RESET" })).s).toBe("prelude");
  });
});


describe("playback evaluation", () => {
  const base = {
    recordedMs: 4000,
    playedMs: 4000,
    startPos: 0,
    endPos: 3.9,
    duration: Number.POSITIVE_INFINITY, // MediaRecorder WebM often reports Infinity
    jumped: false,
    seeked: false,
    rateChanged: false,
    ended: true,
  };
  it("accepts a full, normal-speed playback from the start", () => expect(evaluatePlayback(base).ok).toBe(true));
  it("ended alone is not enough", () => {
    expect(evaluatePlayback({ ...base, ended: false }).ok).toBe(false);
    expect(evaluatePlayback({ ...base, seeked: true }).ok).toBe(false);
    expect(evaluatePlayback({ ...base, rateChanged: true }).ok).toBe(false);
    expect(evaluatePlayback({ ...base, jumped: true })).toMatchObject({ reason: "jumped" });
  });
  it("buffering time does not count as listening", () => {
    // 4 s of wall time but only 1 s actually playing (3 s waiting) -> not enough.
    expect(evaluatePlayback({ ...base, playedMs: 1000 })).toMatchObject({ reason: "too_short" });
  });
  it("must start at the beginning and reach the end of the media", () => {
    expect(evaluatePlayback({ ...base, startPos: 2 })).toMatchObject({ reason: "not_from_start" });
    expect(evaluatePlayback({ ...base, startPos: Number.NaN })).toMatchObject({ reason: "not_from_start" });
    expect(evaluatePlayback({ ...base, endPos: 1 })).toMatchObject({ reason: "end_not_reached" });
    expect(evaluatePlayback({ ...base, endPos: Number.NaN })).toMatchObject({ reason: "end_not_reached" });
    expect(evaluatePlayback({ ...base, duration: 4, endPos: 3.2 })).toMatchObject({ reason: "end_not_reached" });
    expect(evaluatePlayback({ ...base, duration: 4, endPos: 4 }).ok).toBe(true);
  });
  it("continuity: no backwards step, no advance much faster than time spent playing", () => {
    expect(isJump(1, 1.25, 250)).toBe(false);
    expect(isJump(1, 0.5, 250)).toBe(true);
    expect(isJump(0.2, 3.5, 250)).toBe(true);
    expect(isJump(1, 1.9, 600)).toBe(false); // throttled timeupdate is tolerated
  });
});

describe("server room access (visits, sequence, grants)", () => {
  const A = { sid: "session-aaaaaaaaaaaaaaaa", role: "mother" as const };
  const B = { sid: "session-bbbbbbbbbbbbbbbb", role: "father" as const };
  const T0 = Date.now();
  const REC = 3000;
  const later = T0 + REC * 2 + 100;
  const V1 = "visit-one-aaaaaa";
  const V2 = "visit-two-bbbbbb";

  const attempt = (s: typeof A | typeof B, room: number, visit: string, seq: number, now = seq) => {
    const r = createAttempt(s, room, visit, seq, now);
    if (!r.ok) throw new Error(r.reason);
    return r.attemptId;
  };
  const enter = (s: typeof A | typeof B, room: number, visit: string, at: string, now = later) => {
    const r = enterRoom(s, room, visit, at, REC, now);
    if (!r.ok) throw new Error(r.reason);
    return r.grant;
  };

  beforeEach(() => {
    __useMemoryDbForTests();
    for (const s of [A, B]) recordSession({ v: 1, sid: s.sid, role: s.role, iat: Math.floor(T0 / 1000), exp: Math.floor(T0 / 1000) + 3600 });
  });

  it("issues a grant bound to session + account + room", () => {
    const g = enter(A, 2, V1, attempt(A, 2, V1, T0));
    expect(verifyGrant(A, 2, g, later)).toBe(true);
    expect(verifyGrant(A, 3, g, later)).toBe(false); // other room
    expect(verifyGrant(B, 2, g, later)).toBe(false); // other account
    expect(verifyGrant({ ...A, sid: "session-other-xxxxxxxx" }, 2, g, later)).toBe(false); // other session
    expect(verifyGrant(A, 2, undefined, later)).toBe(false);
  });

  it("attempts are one-time and bound to room, account, session and visit", () => {
    const at = attempt(A, 2, V1, T0);
    expect(enterRoom(A, 3, V1, at, REC, later)).toMatchObject({ ok: false, reason: "invalid_attempt" });
    expect(enterRoom(B, 2, V1, at, REC, later)).toMatchObject({ ok: false, reason: "invalid_attempt" });
    expect(enterRoom(A, 2, V2, at, REC, later)).toMatchObject({ ok: false, reason: "invalid_attempt" });
    expect(enterRoom({ ...A, sid: "session-other-xxxxxxxx" }, 2, V1, at, REC, later)).toMatchObject({ ok: false });
    enter(A, 2, V1, at);
    expect(enterRoom(A, 2, V1, at, REC, later + 1)).toMatchObject({ ok: false }); // reuse
  });

  it("rejects implausibly fast completion and bad reports", () => {
    const at = attempt(A, 2, V1, T0);
    expect(enterRoom(A, 2, V1, at, REC, T0 + 1000)).toMatchObject({ ok: false, reason: "too_fast" });
    expect(enterRoom(A, 2, V1, at, 10, later)).toMatchObject({ ok: false, reason: "bad_report" });
    expect(enterRoom(A, 2, V1, 12345, REC, later)).toMatchObject({ ok: false, reason: "invalid_attempt" });
    expect(createAttempt(A, 2, "bad visit!", T0 + 1, T0)).toMatchObject({ ok: false, reason: "bad_request" });
    expect(createAttempt(A, 2, V1, T0 + 2 * 24 * 3600_000, T0)).toMatchObject({ ok: false, reason: "bad_request" });
  });

  it("expires attempts and grants", () => {
    const at = attempt(A, 2, V1, T0);
    expect(enterRoom(A, 2, V1, at, REC, T0 + GATE_LIMITS.attemptTtlMs + 1)).toMatchObject({ ok: false });
    const g = enter(A, 2, V1, attempt(A, 2, V1, T0 + 1, T0));
    expect(verifyGrant(A, 2, g, later + GATE_LIMITS.grantTtlMs + 1)).toBe(false);
  });

  it("a late, OLDER attempt request is stale and changes nothing", () => {
    const newer = attempt(A, 3, V2, T0 + 50, T0);
    // The request for an earlier screen (seq T0 + 10) arrives after the newer one.
    expect(createAttempt(A, 2, V1, T0 + 10, T0 + 60)).toEqual({ ok: false, reason: "stale" });
    expect(enter(A, 3, V2, newer, T0 + REC * 2 + 100)).toBeTruthy(); // the newer attempt still works
  });

  it("re-recording: the new attempt replaces the old one (same visit)", () => {
    const first = attempt(A, 2, V1, T0);
    const second = attempt(A, 2, V1, T0 + 1, T0);
    expect(enterRoom(A, 2, V1, first, REC, later)).toMatchObject({ ok: false });
    expect(enter(A, 2, V1, second)).toBeTruthy();
  });

  it("entering another room invalidates the previous room's grant", () => {
    const g2 = enter(A, 2, V1, attempt(A, 2, V1, T0));
    const at3 = attempt(A, 3, V2, T0 + 5, later);
    expect(verifyGrant(A, 2, g2, later)).toBe(false);
    expect(enter(A, 3, V2, at3, later + REC * 2 + 100)).toBeTruthy();
  });

  it("a late leave from an earlier visit cannot cancel the new visit", () => {
    const old = attempt(A, 2, V1, T0);
    const at = attempt(A, 3, V2, T0 + 5, T0);
    leaveVisit(A, V1); // arrives late
    leaveVisit(A, V1, old);
    const g = enter(A, 3, V2, at);
    leaveVisit(A, V1);
    expect(verifyGrant(A, 3, g, later)).toBe(true);
    leaveVisit(A, V2); // leaving THIS visit ends it
    expect(verifyGrant(A, 3, g, later)).toBe(false);
  });

  it("cancelling one attempt only removes that attempt", () => {
    const at = attempt(A, 2, V1, T0);
    leaveVisit(A, V1, "some-other-attempt-id");
    expect(enter(A, 2, V1, at)).toBeTruthy();
  });

  it("another session cannot cancel this session's visit", () => {
    const g = enter(A, 2, V1, attempt(A, 2, V1, T0));
    leaveVisit(B, V1);
    expect(verifyGrant(A, 2, g, later)).toBe(true);
  });

  it("logout revokes everything of the session", () => {
    const g = enter(A, 4, V1, attempt(A, 4, V1, T0));
    revokeSession(A.sid);
    expect(verifyGrant(A, 4, g, later)).toBe(false);
  });

  it("sessions do not affect each other", () => {
    const a = attempt(A, 2, V1, T0);
    attempt(B, 2, V2, T0 + 100, T0); // father starting does not revoke mother's attempt
    expect(enter(A, 2, V1, a)).toBeTruthy();
  });

  it("in-room creation needs a grant only for rooms 4-7", () => {
    expect([1, 2, 3].map(needsGrantToCreate)).toEqual([false, false, false]);
    expect([4, 5, 6, 7].map(needsGrantToCreate)).toEqual([true, true, true, true]);
  });
});
