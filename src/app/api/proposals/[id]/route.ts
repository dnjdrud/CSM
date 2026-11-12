import { UUID_RE, parentWrite } from "@/server/api-helpers";
import { acceptSonTime, cancelOwnProposal, type TransitionResult } from "@/server/proposals";
import { jsonNoStore } from "@/server/request-guard";

const STATUS: Record<Exclude<TransitionResult, "ok">, number> = { not_found: 404, not_allowed: 409, past_time: 409 };

/**
 * Owner only: { "action": "cancel" } or { "action": "accept_son_time" } (see PROPOSAL_TRANSITIONS).
 * Another parent's id behaves exactly like a missing one (404). A repeated or disallowed
 * change is 409 not_allowed; accepting the son's time after it has passed is 409 past_time.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/proposals/[id]">) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonNoStore({ error: "not_found" }, 404);
  const action = w.body?.action;
  let r: TransitionResult;
  if (action === "cancel") r = cancelOwnProposal(w.session.role, id);
  else if (action === "accept_son_time") r = acceptSonTime(w.session.role, id);
  else return jsonNoStore({ error: "invalid_request" }, 400);
  if (r !== "ok") return jsonNoStore({ error: r }, STATUS[r]);
  return jsonNoStore({ ok: true });
}
