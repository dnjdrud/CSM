import { UUID_RE } from "@/server/api-helpers";
import { answerProposal, type SonAnswer } from "@/server/proposals";
import { isSameOriginRequest } from "@/server/request-guard";
import { getSession } from "@/server/session";

const noStore = { "cache-control": "no-store" };
const back = (m: string, id?: string) =>
  new Response(null, { status: 303, headers: { ...noStore, location: `/admin/proposals?m=${m}${id ? `#p-${id}` : ""}` } });

/**
 * Son answers a proposal (HTML form POST), following PROPOSAL_TRANSITIONS:
 *   accept (proposed -> accepted, time re-checked against the server clock),
 *   other_time (proposed -> other_time, needs a future Korea date + time),
 *   cancel (proposed | accepted | other_time -> cancelled; needs confirm=yes from the
 *   confirmation step). Recorded in this app only; nothing is sent by SMS, e-mail or calendar.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/proposals/[id]">) {
  if (!isSameOriginRequest(req)) return new Response("forbidden", { status: 403, headers: noStore });
  const session = await getSession();
  if (session?.role !== "son") return new Response("unauthorized", { status: 401, headers: noStore });
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return new Response("not found", { status: 404, headers: noStore });
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 8_000) return new Response("too large", { status: 413, headers: noStore });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("bad request", { status: 400, headers: noStore });
  }
  const s = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };
  const action = s("action");
  if (action !== "accept" && action !== "other_time" && action !== "cancel") return back("invalid_request", id);
  if (action === "cancel" && s("confirm") !== "yes") return back("confirm_required", id);
  const answer: SonAnswer =
    action === "other_time" ? { action, message: s("message"), date: s("date"), time: s("time") } : { action, message: s("message") };
  const r = answerProposal(id, answer);
  if (r === "not_found") return new Response("not found", { status: 404, headers: noStore });
  return back(r === "ok" ? `done_${action}` : r, id);
}
