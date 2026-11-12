import "server-only";
import { randomUUID } from "node:crypto";
import { normalizeText } from "@/lib/entry-rules";
import {
  PROPOSAL_LIMITS,
  SEOUL_TZ,
  SON_MESSAGE_MAX,
  isProposalMethod,
  PROPOSAL_TRANSITIONS,
  canTransition,
  validateProposalFields,
  type Proposal,
  type ProposalAction,
  type ProposalActor,
  type ProposalInputError,
  type ProposalMethod,
  type ProposalStatus,
} from "@/lib/proposal-rules";
import type { ParentRole } from "@/lib/roles";
import { getDb } from "./db";

/**
 * Conversation proposals (room 7). A proposal stays 제안 중 until the son answers;
 * nothing is confirmed automatically and nothing is sent outside this app.
 * Parents see only their own proposals; the son sees all of them.
 */

type Row = {
  id: string;
  owner: ParentRole;
  method: ProposalMethod;
  proposed_at: number | null;
  timezone: typeof SEOUL_TZ;
  location: string;
  companion: string;
  message: string;
  status: ProposalStatus;
  son_message: string;
  son_proposed_at: number | null;
  answered_at: number | null;
  cancelled_by: "parent" | "son" | null;
  created_at: number;
  updated_at: number;
};

const toProposal = (r: Row): Proposal => ({
  id: r.id,
  method: r.method,
  proposedAt: r.proposed_at,
  timezone: r.timezone,
  location: r.location,
  companion: r.companion,
  message: r.message,
  status: r.status,
  sonMessage: r.son_message ?? "",
  sonProposedAt: r.son_proposed_at ?? null,
  cancelledBy: r.cancelled_by ?? null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export type ProposalInput = {
  method: ProposalMethod;
  proposedAt: number | null;
  location: string;
  companion: string;
  message: string;
};

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : null);

export function parseProposalInput(raw: unknown, now = Date.now()): { ok: true; input: ProposalInput } | { ok: false; error: ProposalInputError } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_request" };
  const r = raw as Record<string, unknown>;
  if (r.confirm !== true) return { ok: false, error: "confirm_required" };
  if (!isProposalMethod(r.method)) return { ok: false, error: "invalid_request" };
  const f = { date: str(r.date), time: str(r.time), location: str(r.location), companion: str(r.companion), message: str(r.message) };
  if (Object.values(f).some((v) => v === null)) return { ok: false, error: "invalid_request" };
  const fields = f as Record<keyof typeof f, string>;
  const v = validateProposalFields(fields, now);
  if (!v.ok) return v;
  return {
    ok: true,
    input: {
      method: r.method,
      proposedAt: v.proposedAt,
      // A phone call has no place.
      location: r.method === "call" ? "" : normalizeText(fields.location),
      companion: normalizeText(fields.companion),
      message: normalizeText(fields.message),
    },
  };
}

export function listOwnProposals(owner: ParentRole): Proposal[] {
  return (getDb().prepare("SELECT * FROM proposals WHERE owner = ? ORDER BY created_at DESC").all(owner) as unknown as Row[]).map(toProposal);
}

export function createProposal(owner: ParentRole, input: ProposalInput, now = Date.now()): { ok: true; proposal: Proposal } | { ok: false; error: "limit" } {
  const db = getDb();
  const open = (db.prepare("SELECT COUNT(*) AS n FROM proposals WHERE owner = ? AND status = 'proposed'").get(owner) as { n: number }).n;
  if (open >= PROPOSAL_LIMITS.openPerOwnerMax) return { ok: false, error: "limit" };
  const id = randomUUID();
  db.prepare(
    `INSERT INTO proposals (id, owner, method, proposed_at, timezone, location, companion, message, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)`,
  ).run(id, owner, input.method, input.proposedAt, SEOUL_TZ, input.location, input.companion, input.message, now, now);
  return { ok: true, proposal: toProposal(db.prepare("SELECT * FROM proposals WHERE id = ?").get(id) as unknown as Row) };
}

export type TransitionResult = "ok" | "not_found" | "not_allowed" | "past_time";

/**
 * Applies one entry of PROPOSAL_TRANSITIONS atomically: the allowed source states and any
 * time condition are part of the UPDATE's WHERE, so two concurrent or repeated requests
 * cannot both succeed and a cancelled proposal can never come back.
 */
function transition(
  id: string,
  actor: ProposalActor,
  action: ProposalAction,
  set: { sql: string; params: (string | number | null)[] },
  opts: { owner?: ParentRole; timeCondition?: string; now: number },
): TransitionResult {
  const rule = PROPOSAL_TRANSITIONS[actor][action];
  if (!rule) return "not_allowed";
  const db = getDb();
  const ownerSql = opts.owner ? " AND owner = ?" : "";
  const ownerParams = opts.owner ? [opts.owner] : [];
  const from = rule.from.map(() => "?").join(", ");
  const time = opts.timeCondition ? ` AND (${opts.timeCondition})` : "";
  const res = db
    .prepare(`UPDATE proposals SET status = ?, ${set.sql}, updated_at = ? WHERE id = ?${ownerSql} AND status IN (${from})${time}`)
    .run(rule.to, ...set.params, opts.now, id, ...ownerParams, ...rule.from, ...(opts.timeCondition ? [opts.now] : []));
  if (Number(res.changes) === 1) return "ok";
  // Explain why nothing changed. Another parent's proposal looks exactly like a missing one.
  const row = db.prepare(`SELECT status FROM proposals WHERE id = ?${ownerSql}`).get(id, ...ownerParams) as { status: ProposalStatus } | undefined;
  if (!row) return "not_found";
  if (!canTransition(actor, action, row.status)) return "not_allowed";
  return opts.timeCondition ? "past_time" : "not_allowed";
}

/** Parent cancels one of their own proposals (proposed / accepted / other_time). */
export function cancelOwnProposal(owner: ParentRole, id: string, now = Date.now()): TransitionResult {
  return transition(id, "parent", "cancel", { sql: "cancelled_by = 'parent'", params: [] }, { owner, now });
}

/** Parent agrees to the time the son suggested instead. Only from other_time, only while that time is in the future. */
export function acceptSonTime(owner: ParentRole, id: string, now = Date.now()): TransitionResult {
  return transition(id, "parent", "accept_son_time", { sql: "proposed_at = son_proposed_at", params: [] }, {
    owner,
    now,
    timeCondition: "son_proposed_at IS NOT NULL AND son_proposed_at > ?",
  });
}

export type SonAnswer =
  | { action: "accept"; message: string }
  | { action: "other_time"; message: string; date: string; time: string }
  | { action: "cancel"; message: string };

export type AnswerError = "invalid_request" | "not_found" | "not_allowed" | "message_too_long" | "invalid_time" | "past_time" | "too_far" | "time_required";

/**
 * Son answers a proposal, following PROPOSAL_TRANSITIONS. Recorded in this app only and
 * shown only to the parent who made it -- no SMS, e-mail or calendar invite.
 * Accepting re-checks the proposed time against the server clock (now): a proposal whose
 * time has already passed cannot be accepted (past_time); one without a time can.
 */
export function answerProposal(id: string, a: SonAnswer, now = Date.now()): "ok" | AnswerError {
  const message = normalizeText(typeof a.message === "string" ? a.message : "");
  if ([...message].length > SON_MESSAGE_MAX) return "message_too_long";
  const answered = { sql: "son_message = ?, answered_at = ?", params: [message, now] as (string | number)[] };

  switch (a.action) {
    case "accept":
      return transition(id, "son", "accept", answered, { now, timeCondition: "proposed_at IS NULL OR proposed_at > ?" });
    case "other_time": {
      if (!a.date || !a.time) return "time_required";
      const v = validateProposalFields({ date: a.date, time: a.time, location: "", companion: "", message: "" }, now);
      if (!v.ok) return v.error as AnswerError;
      return transition(id, "son", "other_time", { sql: `son_proposed_at = ?, ${answered.sql}`, params: [v.proposedAt, ...answered.params] }, { now });
    }
    case "cancel":
      return transition(id, "son", "cancel", { sql: `cancelled_by = 'son', ${answered.sql}`, params: answered.params }, { now });
    default:
      return "invalid_request";
  }
}

/** Son (admin): every proposal, newest first. `timePassed`: its proposed time is already over (server clock). */
export function listProposalsForSon(now = Date.now()): (Proposal & { owner: ParentRole; timePassed: boolean })[] {
  return (getDb().prepare("SELECT * FROM proposals ORDER BY created_at DESC").all() as unknown as Row[]).map((r) => ({
    ...toProposal(r),
    owner: r.owner,
    timePassed: r.proposed_at !== null && r.proposed_at <= now,
  }));
}
