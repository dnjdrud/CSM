import { isVisitId, leaveVisit } from "@/server/room-access";
import { isSameOriginRequest, readJsonObject } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

/**
 * Leaving ONE visit: { visitId, attemptId? } (sent with sendBeacon/keepalive, so the body
 * may arrive as text/plain). Deletes only that visit's attempt/grant -- a late leave from
 * an earlier screen can never cancel a newer visit. Logout ends everything instead.
 */
export async function POST(req: Request) {
  const headers = { "cache-control": "no-store" };
  if (!isSameOriginRequest(req)) return new Response(null, { status: 403, headers });
  const session = await getParentSession();
  if (!session) return new Response(null, { status: 204, headers });
  // sendBeacon sends text/plain; the body must still be a small plain JSON object.
  const parsed = await readJsonObject(req, 1_000);
  if (!parsed.ok) return new Response(null, { status: parsed.status, headers });
  const body: { visitId?: unknown; attemptId?: unknown } = parsed.value;
  if (!isVisitId(body.visitId)) return new Response(null, { status: 400, headers });
  const attemptId = typeof body.attemptId === "string" && body.attemptId.length <= 64 ? body.attemptId : undefined;
  leaveVisit({ sid: session.sid, role: session.role }, body.visitId, attemptId);
  return new Response(null, { status: 204, headers });
}
