// Shared (client + server) rules for conversation proposals (room 7). No content, no secrets.
// All times are Korea time (Asia/Seoul, UTC+9, no daylight saving).

export const SEOUL_TZ = "Asia/Seoul";
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

export const PROPOSAL_METHODS = ["call", "meet", "with_someone"] as const;
export type ProposalMethod = (typeof PROPOSAL_METHODS)[number];
export const isProposalMethod = (v: unknown): v is ProposalMethod =>
  typeof v === "string" && (PROPOSAL_METHODS as readonly string[]).includes(v);

export const METHOD_LABEL: Record<ProposalMethod, string> = {
  call: "전화",
  meet: "만남",
  with_someone: "다른 분과 함께 만나기",
};

/** proposed = 제안 중 (until the son answers). Nothing is ever confirmed automatically. */
export type ProposalStatus = "proposed" | "accepted" | "other_time" | "cancelled";
export const STATUS_LABEL: Record<ProposalStatus, string> = {
  proposed: "제안 중",
  accepted: "아들이 수락했어요",
  other_time: "아들이 다른 시간을 제안했어요",
  cancelled: "취소했어요",
};

export const PROPOSAL_LIMITS = {
  locationMax: 100,
  companionMax: 100,
  messageMax: 1000,
  /** How far ahead a time may be proposed. */
  maxAheadMs: 366 * 24 * 60 * 60 * 1000,
  /** Open proposals per parent, to bound storage. */
  openPerOwnerMax: 20,
} as const;

export type Proposal = {
  id: string;
  method: ProposalMethod;
  /** UTC ms, or null when no time was chosen (time is optional). */
  proposedAt: number | null;
  timezone: typeof SEOUL_TZ;
  location: string;
  companion: string;
  message: string;
  status: ProposalStatus;
  /** Son's answer (accept / other time / cancel). Stays inside this app. */
  sonMessage: string;
  sonProposedAt: number | null;
  cancelledBy: "parent" | "son" | null;
  createdAt: number;
  updatedAt: number;
};

export function statusText(p: Pick<Proposal, "status" | "cancelledBy">): string {
  if (p.status === "cancelled") return p.cancelledBy === "son" ? "아들이 이번 제안은 어렵다고 했어요" : "취소했어요";
  return STATUS_LABEL[p.status];
}

export const SON_MESSAGE_MAX = 500;

/**
 * Every allowed status change, and nothing else. `cancelled` is final (no action leaves it).
 *  - son:    accept      proposed   -> accepted   (the proposed time, if any, must still be in the future)
 *            other_time  proposed   -> other_time (a future Korea time)
 *            cancel      proposed | accepted | other_time -> cancelled (by son)
 *  - parent: accept_son_time  other_time -> accepted (the son's time must still be in the future)
 *            cancel      proposed | accepted | other_time -> cancelled (by parent; own proposals only)
 * A repeated request (e.g. a second cancel) finds the proposal no longer in an allowed
 * state and is refused the same way as any other disallowed change ("not_allowed").
 * Nothing here sends any message outside the app.
 */
export type ProposalActor = "son" | "parent";
export type ProposalAction = "accept" | "other_time" | "cancel" | "accept_son_time";

export const PROPOSAL_TRANSITIONS: Record<ProposalActor, Partial<Record<ProposalAction, { from: readonly ProposalStatus[]; to: ProposalStatus }>>> = {
  son: {
    accept: { from: ["proposed"], to: "accepted" },
    other_time: { from: ["proposed"], to: "other_time" },
    cancel: { from: ["proposed", "accepted", "other_time"], to: "cancelled" },
  },
  parent: {
    accept_son_time: { from: ["other_time"], to: "accepted" },
    cancel: { from: ["proposed", "accepted", "other_time"], to: "cancelled" },
  },
};

export function canTransition(actor: ProposalActor, action: ProposalAction, status: ProposalStatus): boolean {
  return PROPOSAL_TRANSITIONS[actor][action]?.from.includes(status) ?? false;
}

/** "2026-11-20" + "14:30" in Korea time -> UTC ms. null if malformed or not a real date/time. */
export function seoulLocalToUtc(date: string, time: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [y, mo, da, h, mi] = [+d[1], +d[2], +d[3], +t[1], +t[2]];
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;
  const utc = Date.UTC(y, mo - 1, da, h, mi) - SEOUL_OFFSET_MS;
  // Reject rollovers such as 2026-02-31.
  const back = new Date(utc + SEOUL_OFFSET_MS);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== da) return null;
  return utc;
}

/** Today's date in Korea as YYYY-MM-DD (for the date input's min). */
export function seoulToday(now = Date.now()): string {
  return new Date(now + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}

export function formatSeoul(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export type ProposalInputError =
  | "invalid_request"
  | "invalid_time"
  | "past_time"
  | "too_far"
  | "location_too_long"
  | "companion_too_long"
  | "message_too_long"
  | "confirm_required";

export function validateProposalFields(
  f: { date: string; time: string; location: string; companion: string; message: string },
  now = Date.now(),
): { ok: true; proposedAt: number | null } | { ok: false; error: ProposalInputError } {
  let proposedAt: number | null = null;
  if (f.date || f.time) {
    // Date and time go together; one without the other is unclear.
    proposedAt = f.date && f.time ? seoulLocalToUtc(f.date, f.time) : null;
    if (proposedAt === null) return { ok: false, error: "invalid_time" };
    if (proposedAt <= now) return { ok: false, error: "past_time" };
    if (proposedAt > now + PROPOSAL_LIMITS.maxAheadMs) return { ok: false, error: "too_far" };
  }
  if ([...f.location.trim()].length > PROPOSAL_LIMITS.locationMax) return { ok: false, error: "location_too_long" };
  if ([...f.companion.trim()].length > PROPOSAL_LIMITS.companionMax) return { ok: false, error: "companion_too_long" };
  if ([...f.message.trim()].length > PROPOSAL_LIMITS.messageMax) return { ok: false, error: "message_too_long" };
  return { ok: true, proposedAt };
}

export function proposalErrorText(code: string): string {
  switch (code) {
    case "invalid_time":
      return "날짜와 시간을 함께 골라주세요. 시간을 정하지 않으시려면 둘 다 비워두세요.";
    case "past_time":
      return "이미 지난 시간이에요. 앞으로의 시간을 골라주세요.";
    case "too_far":
      return "1년 안의 시간으로 골라주세요.";
    case "location_too_long":
    case "companion_too_long":
    case "message_too_long":
      return "글이 너무 길어요. 조금 줄여주세요.";
    case "limit":
      return "진행 중인 제안이 너무 많아요. 예전 제안을 취소한 뒤 다시 해주세요.";
    case "unauthorized":
      return "로그인이 끝났어요. 다시 로그인해 주세요.";
    case "not_found":
      return "이 제안을 찾을 수 없어요.";
    case "not_cancellable":
      return "이미 취소된 제안이에요.";
    case "not_open":
      return "지금 상태에서는 할 수 없어요. 목록을 새로 불러왔어요.";
    case "grant_required":
      return "방에 들어온 지 오래되었거나 방을 벗어나서 보내지 못했어요. 7번 방에 다시 들어와 주세요.";
    case "not_allowed":
      return "지금 상태에서는 할 수 없어요(이미 처리되었거나 취소된 제안이에요).";
    default:
      return "보내지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";
  }
}
