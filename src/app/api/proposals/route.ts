import { hasRoomGrant, parentWrite } from "@/server/api-helpers";
import { createProposal, listOwnProposals, parseProposalInput } from "@/server/proposals";
import { jsonNoStore } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

export async function GET() {
  const session = await getParentSession();
  if (!session) return jsonNoStore({ error: "unauthorized" }, 401);
  return jsonNoStore({ proposals: listOwnProposals(session.role) });
}

/** Stored as 제안 중. No automatic confirmation, no message sent outside the app. */
export async function POST(req: Request) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  // Proposals are made inside room 7 only (after its gate). Cancel/accept from /notes need no grant.
  if (!hasRoomGrant(req, w.session, 7)) return jsonNoStore({ error: "grant_required" }, 403);
  const parsed = parseProposalInput(w.body);
  if (!parsed.ok) return jsonNoStore({ error: parsed.error }, 400);
  const res = createProposal(w.session.role, parsed.input);
  if (!res.ok) return jsonNoStore({ error: "limit" }, 409);
  return jsonNoStore({ proposal: res.proposal }, 201);
}
