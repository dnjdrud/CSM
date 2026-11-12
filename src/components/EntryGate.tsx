"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import type { RoomBodyView } from "@/content/types";
import { ERROR_TEXT, type GateError, type GateEvent, type GateState } from "@/lib/gate-machine";
import { GATE_LIMITS, evaluatePlayback, isJump } from "@/lib/gate-rules";
import { leaveVisit, nextSeq } from "@/lib/gate-visit";

/**
 * Entry recording gate for rooms 2-7. Every entry needs a NEW recording made here:
 * 녹음 시작하기 -> 녹음 끝내기 -> 내 목소리 듣기 (to the end) -> 이 마음으로 들어가기.
 *
 * Audio stays in this tab's memory as a Blob/Object URL and is never uploaded,
 * stored, transcribed or reused. It is discarded on re-record, leave, page hide,
 * visibility change, unmount, and immediately after entering. There is no text
 * alternative and no skip; if recording is impossible the only options are retry or
 * the room list.
 *
 * Async safety: every async step captures a generation number (`gen`). release()
 * bumps it, aborts in-flight requests and detaches all media listeners, so a late
 * server response, recorder callback or audio event from an earlier attempt can never
 * change the current state. Aborting a fetch does not undo it on the server, so a late
 * successful response is followed by a scoped cancel (this visit / this attempt only).
 */

type Media = {
  gen: number;
  stream?: MediaStream;
  recorder?: MediaRecorder;
  chunks: Blob[];
  url?: string;
  audio?: HTMLAudioElement;
  /** Removes every listener of the current playback at once. */
  audioAbort?: AbortController;
  /** In-flight attempt/enter request. */
  fetchAbort?: AbortController;
  attemptId?: string;
  startedAt?: number;
  stoppedAt?: number;
  recordedMs?: number;
  timer?: number;
};

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
}

function detectSupport(): GateError | null {
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return "unsupported";
  return null;
}

function mapMediaError(e: unknown): GateError {
  const name = (e as { name?: string })?.name ?? "";
  if (["NotAllowedError", "SecurityError", "PermissionDeniedError"].includes(name)) return "denied";
  if (["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(name)) return "no_device";
  if (["NotReadableError", "TrackStartError", "AbortError"].includes(name)) return "busy";
  return "record_failed";
}

type Props = {
  roomId: number;
  /** The current visit (one stay on this room page). Changes when the visit is restarted. */
  visitId: string;
  phrase: string;
  state: GateState;
  dispatch: Dispatch<GateEvent>;
  onEntered: (body: RoomBodyView, grant: string) => void;
  onBack: (() => void) | null;
  onRoomsList: () => void;
};

export function EntryGate({ roomId, visitId, phrase, state, dispatch, onEntered, onBack, onRoomsList }: Props) {
  const m = useRef<Media>({ gen: 0, chunks: [] });
  const mounted = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [seconds, setSeconds] = useState(0);

  /** Is the step that captured `gen` still the current one in a mounted gate? */
  const alive = (gen: number) => mounted.current && gen === m.current.gen;

  /** Stops the mic, the recorder, playback and requests, and forgets the recording. */
  const release = useCallback(() => {
    const cur = m.current;
    cur.gen += 1; // invalidates every in-flight async step
    cur.fetchAbort?.abort();
    cur.audioAbort?.abort(); // detaches all listeners of the old <audio>
    if (cur.timer) window.clearTimeout(cur.timer);
    if (cur.recorder) {
      cur.recorder.ondataavailable = null;
      cur.recorder.onstop = null;
      cur.recorder.onerror = null;
      if (cur.recorder.state !== "inactive") {
        try {
          cur.recorder.stop();
        } catch {}
      }
    }
    cur.stream?.getTracks().forEach((t) => t.stop());
    if (cur.audio) {
      cur.audio.pause();
      cur.audio.removeAttribute("src");
      cur.audio.load();
    }
    if (cur.url) URL.revokeObjectURL(cur.url);
    m.current = { gen: cur.gen, chunks: [] };
  }, []);

  // Mount / unmount (also correct under React StrictMode's mount -> unmount -> mount).
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      release();
    };
  }, [release]);

  // Hidden tab, app switch, screen lock, closing or bfcache -> stop and discard at once.
  // (RoomFlow then restarts the whole visit from its first preparation screen.)
  useEffect(() => {
    const onHide = () => release();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") release();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [release]);

  // Announce each new screen.
  useEffect(() => {
    headingRef.current?.focus();
  }, [state.s]);

  // Recording timer (display only).
  useEffect(() => {
    if (state.s !== "recording") return;
    const id = window.setInterval(() => setSeconds(Math.floor((performance.now() - state.startedAt) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [state]);

  async function startRecording() {
    release();
    setSeconds(0);
    const gen = m.current.gen;
    const visit = visitId;
    dispatch({ t: "REQUEST_MIC" });

    const unsupported = detectSupport();
    if (unsupported) return dispatch({ t: "FAIL", error: unsupported });

    // 1. New one-time attempt on the server (a newer seq replaces earlier attempts/grants).
    const ctrl = new AbortController();
    m.current.fetchAbort = ctrl;
    let attemptId: string;
    try {
      const res = await fetch(`/api/rooms/${roomId}/attempt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitId: visit, seq: nextSeq() }),
        credentials: "same-origin",
        cache: "no-store",
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { attemptId?: string; error?: string };
      if (!alive(gen)) {
        // Re-recorded / left meanwhile: cancel just this attempt; it cannot touch newer ones.
        if (data.attemptId) leaveVisit(visit, data.attemptId);
        return;
      }
      if (res.status === 401) return dispatch({ t: "FAIL", error: "session" });
      if (res.status === 409) return dispatch({ t: "FAIL", error: "superseded" });
      if (!res.ok || !data.attemptId) throw new Error("attempt");
      attemptId = data.attemptId;
    } catch {
      if (alive(gen)) dispatch({ t: "FAIL", error: "server" });
      return;
    }

    // 2. Microphone (needs the user's tap; we are inside the click handler chain).
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      if (alive(gen)) {
        leaveVisit(visit, attemptId);
        dispatch({ t: "FAIL", error: mapMediaError(e) });
      }
      return;
    }
    if (!alive(gen)) {
      stream.getTracks().forEach((t) => t.stop());
      leaveVisit(visit, attemptId);
      return;
    }

    // 3. Recorder
    const mimeType = pickMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      leaveVisit(visit, attemptId);
      return dispatch({ t: "FAIL", error: "record_failed" });
    }

    const cur = m.current;
    cur.stream = stream;
    cur.recorder = rec;
    cur.attemptId = attemptId;
    cur.chunks = [];
    rec.ondataavailable = (e) => {
      if (alive(gen) && e.data && e.data.size > 0) cur.chunks.push(e.data);
    };
    rec.onerror = () => {
      if (!alive(gen)) return;
      release();
      leaveVisit(visit, attemptId);
      dispatch({ t: "FAIL", error: "record_failed" });
    };
    rec.onstop = () => {
      if (!alive(gen)) return;
      const recordedMs = (cur.stoppedAt ?? performance.now()) - (cur.startedAt ?? performance.now());
      cur.stream?.getTracks().forEach((t) => t.stop()); // mic off as soon as recording ends
      cur.stream = undefined;
      const blob = new Blob(cur.chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      cur.chunks = [];
      if (recordedMs < GATE_LIMITS.minRecordMs) return dispatch({ t: "FAIL", error: "too_short" });
      if (blob.size < GATE_LIMITS.minBlobBytes) return dispatch({ t: "FAIL", error: "empty" });
      cur.url = URL.createObjectURL(blob);
      cur.recordedMs = recordedMs;
      dispatch({ t: "RECORDED", recordedMs });
    };

    try {
      rec.start(250);
    } catch {
      release();
      leaveVisit(visit, attemptId);
      return dispatch({ t: "FAIL", error: "record_failed" });
    }
    cur.startedAt = performance.now();
    cur.timer = window.setTimeout(() => {
      if (alive(gen)) stopRecording();
    }, GATE_LIMITS.maxRecordMs);
    dispatch({ t: "MIC_READY", at: cur.startedAt });
  }

  function stopRecording() {
    const cur = m.current;
    if (cur.timer) window.clearTimeout(cur.timer);
    if (cur.recorder?.state === "recording") {
      cur.stoppedAt = performance.now();
      cur.recorder.stop();
    }
  }

  /**
   * Always plays from the very beginning on a fresh <audio>. Listening time counts only
   * while the element is actually playing (buffering excluded), and media position must
   * progress continuously from 0 to the end at normal speed.
   */
  function play() {
    const cur = m.current;
    if (!cur.url || !cur.recordedMs) return dispatch({ t: "RERECORD" });
    // Detach and stop any previous playback first, so its late events cannot count.
    cur.audioAbort?.abort();
    if (cur.audio) {
      cur.audio.pause();
      cur.audio.removeAttribute("src");
    }
    const gen = cur.gen;
    const ac = new AbortController();
    cur.audioAbort = ac;
    const a = new Audio();
    const on = (type: string, fn: () => void) => a.addEventListener(type, fn, { signal: ac.signal });
    const live = () => alive(gen) && !ac.signal.aborted && m.current.audio === a;
    a.preload = "auto";
    a.setAttribute("playsinline", "");
    a.src = cur.url;
    a.currentTime = 0;
    a.playbackRate = 1;
    a.defaultPlaybackRate = 1;
    const recordedMs = cur.recordedMs;

    let started = false;
    let finished = false;
    let seeked = false;
    let rateChanged = false;
    let jumped = false;
    let startPos = Number.NaN;
    let playedMs = 0;
    let playingSince: number | null = null;
    let lastPos = 0;
    let lastPlayed = 0;
    const played = () => playedMs + (playingSince === null ? 0 : performance.now() - playingSince);
    const pauseClock = () => {
      if (playingSince !== null) {
        playedMs += performance.now() - playingSince;
        playingSince = null;
      }
    };

    const stop = (error: GateError) => {
      if (finished || !live()) return;
      finished = true;
      pauseClock();
      ac.abort();
      dispatch({ t: "PLAY_STOPPED", error });
    };
    on("playing", () => {
      if (!live()) return;
      if (!started) {
        started = true;
        startPos = a.currentTime;
        lastPos = a.currentTime;
      }
      if (playingSince === null) playingSince = performance.now();
    });
    // Buffering: the clock stops, so waiting time never counts as listening.
    on("waiting", () => live() && pauseClock());
    on("timeupdate", () => {
      if (!live() || !started) return;
      const p = played();
      if (isJump(lastPos, a.currentTime, p - lastPlayed)) jumped = true;
      lastPos = a.currentTime;
      lastPlayed = p;
    });
    on("seeking", () => {
      if (live() && started) seeked = true;
    });
    on("ratechange", () => {
      if (live() && (a.playbackRate !== 1 || a.defaultPlaybackRate !== 1)) rateChanged = true;
    });
    on("pause", () => {
      if (live() && !a.ended) stop("play_interrupted");
    });
    on("error", () => stop("play_failed"));
    on("emptied", () => started && stop("play_failed"));
    on("ended", () => {
      if (finished || !live()) return;
      finished = true;
      pauseClock();
      const verdict = evaluatePlayback({
        recordedMs,
        playedMs,
        startPos: started ? startPos : Number.NaN,
        endPos: a.currentTime,
        duration: a.duration,
        jumped,
        seeked,
        rateChanged: rateChanged || a.playbackRate !== 1,
        ended: true,
      });
      ac.abort();
      dispatch(verdict.ok ? { t: "PLAY_DONE" } : { t: "PLAY_STOPPED", error: "play_invalid" });
    });
    cur.audio = a;
    dispatch({ t: "PLAY" });
    a.play().catch(() => stop("play_failed"));
  }

  function stopPlayback() {
    m.current.audio?.pause(); // -> pause event -> back to `recorded`, listen again from the start
  }

  function rerecord() {
    const old = m.current.attemptId;
    release();
    if (old) leaveVisit(visitId, old); // cancel only the discarded attempt
    dispatch({ t: "RERECORD" });
  }

  async function enter() {
    const cur = m.current;
    if (state.s !== "listened" || !cur.attemptId || !cur.recordedMs) return;
    const attemptId = cur.attemptId;
    const recordedMs = Math.round(cur.recordedMs);
    const gen = cur.gen;
    const visit = visitId;
    const ctrl = new AbortController();
    cur.fetchAbort = ctrl;
    dispatch({ t: "CONFIRM" });
    try {
      const res = await fetch(`/api/rooms/${roomId}/enter`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitId: visit, attemptId, recordedMs }),
        credentials: "same-origin",
        cache: "no-store",
        signal: ctrl.signal,
      });
      const data = (await res.json().catch(() => ({}))) as { room?: RoomBodyView; grant?: string };
      if (!alive(gen)) {
        // Left / hidden while waiting: the server may still have issued a grant. Drop this
        // visit's rows (never other visits') and never show the body.
        if (res.ok) leaveVisit(visit);
        return;
      }
      // The recording has served its purpose either way: discard it now.
      release();
      if (res.status === 401) return dispatch({ t: "ENTER_FAILED", error: "session" });
      if (!res.ok || !data.room || !data.grant) return dispatch({ t: "ENTER_FAILED", error: "server" });
      onEntered(data.room, data.grant);
      dispatch({ t: "ENTERED" });
    } catch {
      // Aborted or network error. An abort does not undo the request on the server.
      if (ctrl.signal.aborted) {
        leaveVisit(visit);
        return;
      }
      if (!alive(gen)) return;
      release();
      dispatch({ t: "ENTER_FAILED", error: "server" });
    }
  }

  const error = "error" in state ? state.error : undefined;
  const h1 = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="mb-6 text-title font-bold outline-none">
      {text}
    </h1>
  );
  const phraseBox = (
    <blockquote className="panel my-6 border-l-4 border-btn text-2xl font-bold leading-relaxed">“{phrase}”</blockquote>
  );
  const roomsButton = (
    <button type="button" className="btn btn-secondary" onClick={onRoomsList}>
      방 목록으로
    </button>
  );
  const rerecordButton = (
    <button type="button" className="btn btn-secondary" onClick={rerecord}>
      다시 녹음하기
    </button>
  );
  const errorBox = error ? (
    <p role="alert" className="mt-4 rounded-2xl bg-error-bg p-4 text-error">
      {ERROR_TEXT[error]}
    </p>
  ) : null;

  let body: React.ReactNode;
  let actions: React.ReactNode;

  switch (state.s) {
    case "ready":
      body = (
        <>
          {h1("목소리로 확인하기")}
          <p>아래 버튼을 누르고 표시된 말을 말씀해 주세요.</p>
          {phraseBox}
          <p className="text-muted">
            녹음은 아들에게 전달되지 않고 저장되지도 않아요. 이 방에 들어가는 확인에만 쓰고 바로 지워요.
          </p>
          {errorBox}
        </>
      );
      actions = (
        <>
          {error === "session" ? (
            <Link href="/login" className="btn btn-primary">
              다시 로그인하기
            </Link>
          ) : (
            <button type="button" className="btn btn-primary" onClick={startRecording}>
              {error ? "다시 녹음 시작하기" : "녹음 시작하기"}
            </button>
          )}
          {onBack && (
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              앞 화면으로
            </button>
          )}
          {roomsButton}
        </>
      );
      break;

    case "requestingPermission":
      body = (
        <>
          {h1("마이크를 준비하고 있어요")}
          <p role="status">마이크 사용을 묻는 창이 뜨면 ‘허용’을 눌러주세요.</p>
        </>
      );
      actions = (
        <>
          {rerecordButton}
          {roomsButton}
        </>
      );
      break;

    case "recording":
      body = (
        <>
          {h1("녹음하고 있어요")}
          <p>이 말을 말씀해 주세요.</p>
          {phraseBox}
          <p className="text-lg font-bold" role="timer" aria-live="off">
            <span aria-hidden="true">● </span>녹음 중 {seconds}초
          </p>
          <p className="mt-2 text-muted">다 말씀하셨으면 아래 버튼을 눌러주세요.</p>
        </>
      );
      actions = (
        <>
          <button type="button" className="btn btn-primary" onClick={stopRecording}>
            녹음 끝내기
          </button>
          {rerecordButton}
          {roomsButton}
        </>
      );
      break;

    case "recorded":
      body = (
        <>
          {h1("내 목소리 듣기")}
          <p>녹음한 목소리를 처음부터 끝까지 들어주세요. 다 들으셔야 들어갈 수 있어요.</p>
          {errorBox}
        </>
      );
      actions = (
        <>
          <button type="button" className="btn btn-primary" onClick={play}>
            내 목소리 듣기
          </button>
          {rerecordButton}
          {roomsButton}
        </>
      );
      break;

    case "playing":
      body = (
        <>
          {h1("듣고 있어요")}
          <p role="status">끝까지 들으시면 다음 버튼이 나타나요.</p>
          <p className="mt-2 text-muted">중간에 멈추면 처음부터 다시 들어야 해요.</p>
        </>
      );
      actions = (
        <>
          <button type="button" className="btn btn-secondary" onClick={stopPlayback}>
            멈추기
          </button>
          {rerecordButton}
          {roomsButton}
        </>
      );
      break;

    case "listened":
      body = (
        <>
          {h1("끝까지 들으셨어요")}
          <p>이 마음으로 방에 들어가시겠어요?</p>
          {phraseBox}
        </>
      );
      actions = (
        <>
          <button type="button" className="btn btn-primary" onClick={enter}>
            이 마음으로 들어가기
          </button>
          <button type="button" className="btn btn-secondary" onClick={play}>
            다시 듣기
          </button>
          {rerecordButton}
          {roomsButton}
        </>
      );
      break;

    case "confirmed":
      body = (
        <>
          {h1("들어가고 있어요")}
          <p role="status">잠시만 기다려 주세요.</p>
        </>
      );
      actions = roomsButton;
      break;

    default:
      return null;
  }

  return (
    <section className="flex flex-1 flex-col">
      <p className="mb-2 text-muted">{roomId}번 방 · 마지막 단계</p>
      {body}
      <div className="mt-auto grid gap-3 pt-10">{actions}</div>
    </section>
  );
}
