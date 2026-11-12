// Pure state machine for the room entry gate. No browser APIs here.
//
// prelude -> ready -> requestingPermission -> recording -> recorded -> playing
//         -> listened -> confirmed -> room
//
// Rules:
//  - Re-recording (from any post-recording state) drops listened/confirmed.
//  - Interrupted or failed playback goes back to `recorded` (listen again from the start).
//  - `confirmed` is only reachable from `listened`; `room` only from `confirmed`.
//  - Leaving/reset returns to `prelude` with nothing kept.

export type GateError =
  | "unsupported"
  | "insecure"
  | "denied"
  | "no_device"
  | "busy"
  | "too_short"
  | "empty"
  | "record_failed"
  | "play_failed"
  | "play_interrupted"
  | "play_invalid"
  | "server"
  | "session"
  | "superseded"
  | "hidden";

export type GateState =
  | { s: "prelude" }
  | { s: "ready"; error?: GateError }
  | { s: "requestingPermission" }
  | { s: "recording"; startedAt: number }
  | { s: "recorded"; recordedMs: number; error?: GateError }
  | { s: "playing"; recordedMs: number }
  | { s: "listened"; recordedMs: number }
  | { s: "confirmed"; recordedMs: number }
  | { s: "room" };

export type GateEvent =
  | { t: "PRELUDE_DONE" }
  | { t: "REQUEST_MIC" }
  | { t: "MIC_READY"; at: number }
  | { t: "FAIL"; error: GateError }
  | { t: "RECORDED"; recordedMs: number }
  | { t: "PLAY" }
  | { t: "PLAY_DONE" }
  | { t: "PLAY_STOPPED"; error: GateError }
  | { t: "CONFIRM" }
  | { t: "ENTERED" }
  | { t: "ENTER_FAILED"; error: GateError }
  | { t: "RERECORD" }
  | { t: "RESET" };

export const INITIAL_GATE: GateState = { s: "prelude" };

export function gateReducer(state: GateState, ev: GateEvent): GateState {
  switch (ev.t) {
    case "RESET":
      return { s: "prelude" };
    case "PRELUDE_DONE":
      return state.s === "prelude" ? { s: "ready" } : state;
    case "RERECORD":
      // Any recorded/listened/confirmed result is discarded.
      return state.s === "prelude" || state.s === "room" ? state : { s: "ready" };
    case "REQUEST_MIC":
      return state.s === "ready" ? { s: "requestingPermission" } : state;
    case "MIC_READY":
      return state.s === "requestingPermission" ? { s: "recording", startedAt: ev.at } : state;
    case "FAIL":
      // Mic / recording failures: back to ready with a reason. Only retry or leave.
      return state.s === "requestingPermission" || state.s === "recording" || state.s === "ready"
        ? { s: "ready", error: ev.error }
        : state;
    case "RECORDED":
      return state.s === "recording" ? { s: "recorded", recordedMs: ev.recordedMs } : state;
    case "PLAY":
      return state.s === "recorded" || state.s === "listened"
        ? { s: "playing", recordedMs: state.recordedMs }
        : state;
    case "PLAY_DONE":
      return state.s === "playing" ? { s: "listened", recordedMs: state.recordedMs } : state;
    case "PLAY_STOPPED":
      return state.s === "playing" ? { s: "recorded", recordedMs: state.recordedMs, error: ev.error } : state;
    case "CONFIRM":
      return state.s === "listened" ? { s: "confirmed", recordedMs: state.recordedMs } : state;
    case "ENTERED":
      return state.s === "confirmed" ? { s: "room" } : state;
    case "ENTER_FAILED":
      // The server refused this attempt: start a fresh recording.
      return state.s === "confirmed" ? { s: "ready", error: ev.error } : state;
  }
}

export const ERROR_TEXT: Record<GateError, string> = {
  unsupported: "이 브라우저에서는 녹음을 할 수 없어요. 휴대폰의 기본 브라우저(아이폰은 Safari, 안드로이드는 Chrome)로 열어주세요.",
  insecure: "안전한 주소(https)로 열었을 때만 마이크를 쓸 수 있어요. 아들에게 알려주세요.",
  denied: "마이크 사용이 허락되지 않았어요. 브라우저 설정에서 이 사이트의 마이크를 ‘허용’으로 바꾼 뒤 다시 눌러주세요.",
  no_device: "마이크를 찾지 못했어요. 마이크가 있는 기기에서 다시 해주세요.",
  busy: "다른 앱이 마이크를 쓰고 있어요. 통화나 다른 녹음을 끝낸 뒤 다시 눌러주세요.",
  too_short: "녹음이 너무 짧았어요. 표시된 말을 말씀하신 뒤 ‘녹음 끝내기’를 눌러주세요.",
  empty: "녹음된 소리가 없어요. 다시 녹음해 주세요.",
  record_failed: "녹음 중에 문제가 생겼어요. 다시 녹음해 주세요.",
  play_failed: "녹음을 재생하지 못했어요. 다시 듣기를 눌러보시고, 계속 안 되면 다시 녹음해 주세요.",
  play_interrupted: "중간에 멈췄어요. 처음부터 다시 들어주세요.",
  play_invalid: "끝까지 듣지 못한 것 같아요. 처음부터 다시 들어주세요.",
  server: "확인하지 못했어요. 처음부터 다시 녹음해 주세요.",
  session: "로그인 시간이 끝났어요. 다시 로그인해 주세요.",
  superseded: "다른 화면에서 새로 녹음을 시작해서 이 녹음은 멈췄어요. 이 화면에서 하시려면 다시 녹음해 주세요.",
  hidden: "화면을 벗어나서 녹음과 듣기를 멈추고 지웠어요. 처음부터 다시 해주세요.",
};
