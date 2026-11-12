import { getRoomBodyAfterGate, getRoomDefinition, parseRoomId } from "@/content/rooms";
import { enterRoom } from "@/server/room-access";
import { isSameOriginRequest, jsonNoStore, readJsonObject } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

/**
 * Final step of the gate. Consumes the one-time attempt and, only then, returns
 * the room body together with a short-lived grant for in-room requests.
 * No audio is ever sent here -- only the attempt id and the recording length.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/rooms/[roomId]/enter">) {
  if (!isSameOriginRequest(req)) return jsonNoStore({ error: "forbidden" }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return jsonNoStore({ error: "invalid_request" }, 400);
  }
  const session = await getParentSession();
  if (!session) return jsonNoStore({ error: "unauthorized" }, 401);

  const id = parseRoomId((await ctx.params).roomId);
  const room = id === null ? null : getRoomDefinition(id);
  if (!room || !room.requiresRecording) return jsonNoStore({ error: "not_found" }, 404);

  // Plain JSON object only (null / array / primitive / oversized -> normal 400 or 413).
  const parsed = await readJsonObject(req, 4_000);
  if (!parsed.ok) return jsonNoStore({ error: parsed.status === 413 ? "too_large" : "invalid_request" }, parsed.status);
  const body: { visitId?: unknown; attemptId?: unknown; recordedMs?: unknown } = parsed.value;

  const result = enterRoom({ sid: session.sid, role: session.role }, room.id, body.visitId, body.attemptId, body.recordedMs);
  if (!result.ok) return jsonNoStore({ error: result.reason }, result.reason === "too_fast" ? 425 : 409);

  return jsonNoStore({ grant: result.grant, expiresAt: result.expiresAt, room: getRoomBodyAfterGate(room.id) });
}
