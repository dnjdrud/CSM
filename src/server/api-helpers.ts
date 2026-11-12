import "server-only";
import { isJsonRequest, isSameOriginRequest, jsonNoStore, readJsonObject } from "./request-guard";
import { GRANT_HEADER, verifyGrant } from "./room-access";
import { getParentSession, type ParentSession } from "./session";

/** Common checks for parent write APIs: same origin, JSON body, logged-in parent. */
export async function parentWrite(
  req: Request,
  { needsBody = true }: { needsBody?: boolean } = {},
): Promise<{ ok: true; session: ParentSession; body: Record<string, unknown> | null } | { ok: false; res: Response }> {
  if (!isSameOriginRequest(req)) return { ok: false, res: jsonNoStore({ error: "forbidden" }, 403) };
  const session = await getParentSession();
  if (!session) return { ok: false, res: jsonNoStore({ error: "unauthorized" }, 401) };
  if (!needsBody) return { ok: true, session, body: null };
  if (!isJsonRequest(req)) return { ok: false, res: jsonNoStore({ error: "invalid_request" }, 400) };
  // Plain JSON object only, size-limited while streaming (null / array / primitive -> 400).
  const parsed = await readJsonObject(req, 64_000);
  if (!parsed.ok) return { ok: false, res: jsonNoStore({ error: parsed.status === 413 ? "too_large" : "invalid_request" }, parsed.status) };
  return { ok: true, session, body: parsed.value };
}

/** In-room server actions: the grant from this visit's successful entry, for this session + room. */
export function hasRoomGrant(req: Request, session: ParentSession, roomId: number): boolean {
  return verifyGrant({ sid: session.sid, role: session.role }, roomId, req.headers.get(GRANT_HEADER));
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
