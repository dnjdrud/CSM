import { needsGrantToCreate } from "@/lib/entry-rules";
import { hasRoomGrant, parentWrite } from "@/server/api-helpers";
import { createEntry, getKeyring, listOwnEntries, parseEntryInput } from "@/server/entries";
import { jsonNoStore } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

/** The logged-in parent's own entries only. Another parent's entries are never returned. */
export async function GET() {
  const session = await getParentSession();
  if (!session) return jsonNoStore({ error: "unauthorized" }, 401);
  return jsonNoStore({ entries: listOwnEntries(session.role) });
}

export async function POST(req: Request) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  const parsed = parseEntryInput(w.body);
  if (!parsed.ok) return jsonNoStore({ error: parsed.error }, 400);
  // New writing inside rooms 4-7 exists only behind the gate: this visit's grant must be valid.
  // Decided here from the room, not from anything the client claims about itself.
  if (needsGrantToCreate(parsed.input.roomId) && !hasRoomGrant(req, w.session, parsed.input.roomId)) {
    return jsonNoStore({ error: "grant_required" }, 403);
  }
  // Sealed entries are only accepted once the parent has a personal password (keyring).
  if (parsed.input.kind === "sealed" && !getKeyring(w.session.role)) return jsonNoStore({ error: "no_keyring" }, 409);
  const res = createEntry(w.session.role, parsed.input);
  if (!res.ok) return jsonNoStore({ error: "limit" }, 409);
  return jsonNoStore({ entry: res.entry }, 201);
}
