import { parentWrite } from "@/server/api-helpers";
import { createKeyring, getKeyring, parseKeyring, resetKeyring } from "@/server/entries";
import { jsonNoStore } from "@/server/request-guard";
import { getParentSession } from "@/server/session";

/**
 * Personal password metadata: KDF parameters, salt and an encrypted verifier.
 * The password and the derived key never reach the server.
 */
export async function GET() {
  const session = await getParentSession();
  if (!session) return jsonNoStore({ error: "unauthorized" }, 401);
  return jsonNoStore({ keyring: getKeyring(session.role) });
}

export async function POST(req: Request) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  const k = parseKeyring(w.body);
  if (!k) return jsonNoStore({ error: "invalid_request" }, 400);
  if (!createKeyring(w.session.role, k)) return jsonNoStore({ error: "exists" }, 409);
  return jsonNoStore({ keyring: k }, 201);
}

/** Forgotten personal password: deletes the keyring and every sealed entry (unrecoverable). */
export async function DELETE(req: Request) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  if ((w.body as { confirm?: unknown } | null)?.confirm !== "delete-sealed-entries") {
    return jsonNoStore({ error: "confirm_required" }, 400);
  }
  return jsonNoStore(resetKeyring(w.session.role));
}
