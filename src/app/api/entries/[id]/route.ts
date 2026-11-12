import { UUID_RE, parentWrite } from "@/server/api-helpers";
import { deleteEntry, getKeyring, parseEntryInput, replaceEntry } from "@/server/entries";
import { jsonNoStore } from "@/server/request-guard";

/** 고쳐 쓰기 / 공개 범위 변경. Owner only; other ids (including the other parent's) are 404. */
export async function PUT(req: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const w = await parentWrite(req);
  if (!w.ok) return w.res;
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return jsonNoStore({ error: "not_found" }, 404);
  const parsed = parseEntryInput(w.body);
  if (!parsed.ok) return jsonNoStore({ error: parsed.error }, 400);
  if (parsed.input.kind === "sealed" && !getKeyring(w.session.role)) return jsonNoStore({ error: "no_keyring" }, 409);
  const entry = replaceEntry(w.session.role, id, parsed.input);
  if (!entry) return jsonNoStore({ error: "not_found" }, 404);
  return jsonNoStore({ entry });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/entries/[id]">) {
  const w = await parentWrite(req, { needsBody: false });
  if (!w.ok) return w.res;
  const { id } = await ctx.params;
  if (!UUID_RE.test(id) || !deleteEntry(w.session.role, id)) return jsonNoStore({ error: "not_found" }, 404);
  return jsonNoStore({ ok: true });
}
