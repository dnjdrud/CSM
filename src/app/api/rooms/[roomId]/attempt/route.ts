import { getRoomDefinition, parseRoomId } from "@/content/rooms";
import { createAttempt } from "@/server/room-access";
import { isSameOriginRequest, jsonNoStore, readJsonObject } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

/**
 * Starts a new entry attempt (on 녹음 시작하기): { visitId, seq }.
 * A newer seq replaces every earlier attempt/grant of this session; an older one is
 * a late request from an earlier screen and is refused with 409 "stale" (no changes).
 */
export async function POST(req: Request, ctx: RouteContext<"/api/rooms/[roomId]/attempt">) {
  if (!isSameOriginRequest(req)) return jsonNoStore({ error: "forbidden" }, 403);
  const session = await getParentSession();
  if (!session) return jsonNoStore({ error: "unauthorized" }, 401);

  const id = parseRoomId((await ctx.params).roomId);
  const room = id === null ? null : getRoomDefinition(id);
  if (!room || !room.requiresRecording) return jsonNoStore({ error: "not_found" }, 404);

  // Plain JSON object only (null / array / primitive / oversized -> normal 400 or 413).
  const parsed = await readJsonObject(req, 4_000);
  if (!parsed.ok) return jsonNoStore({ error: parsed.status === 413 ? "too_large" : "invalid_request" }, parsed.status);
  const body: { visitId?: unknown; seq?: unknown } = parsed.value;
  const r = createAttempt({ sid: session.sid, role: session.role }, room.id, body.visitId, body.seq);
  if (!r.ok) return jsonNoStore({ error: r.reason }, r.reason === "stale" ? 409 : 400);
  return jsonNoStore({ attemptId: r.attemptId });
}
