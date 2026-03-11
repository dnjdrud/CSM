// Phase 4-4: Notifications created only via Edge Function. Auth: JWT must match actorId.
// Deno + Supabase Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTIFY_TYPES = ["FOLLOWED_YOU", "COMMENTED_ON_YOUR_POST", "REACTED_TO_YOUR_POST", "REPLIED_TO_YOUR_COMMENT", "REACTED_TO_YOUR_COMMENT", "MENTIONED_IN_COMMENT", "NEW_MESSAGE"] as const;
type NotifyType = (typeof NOTIFY_TYPES)[number];

interface NotifyPayload {
  type: NotifyType;
  recipientId: string;
  actorId: string;
  postId?: string;
}

function getUserIdFromJwt(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = getUserIdFromJwt(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: NotifyPayload;
  try {
    body = (await req.json()) as NotifyPayload;
  } catch (e) {
    console.error("[notify] Invalid JSON body", e);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { type, recipientId, actorId, postId } = body;
  console.log("[notify] request", { type, actorId, recipientId, postId: postId ?? null });
  if (!type || !recipientId || !actorId || !NOTIFY_TYPES.includes(type)) {
    console.warn("[notify] Missing or invalid payload", { type, recipientId: !!recipientId, actorId: !!actorId });
    return new Response(JSON.stringify({ error: "Missing or invalid type, recipientId, actorId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (userId !== actorId) {
    return new Response(JSON.stringify({ error: "Forbidden: actorId must match authenticated user" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (recipientId === actorId) {
    return new Response(JSON.stringify({ error: "recipientId must not equal actorId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count: recentByActor } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", actorId)
    .gte("created_at", windowStart);

  if ((recentByActor ?? 0) > 30) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // NEW_MESSAGE uses a shorter dedup window (1 min) so multiple messages can each notify
  const dedupWindowMs = type === "NEW_MESSAGE" ? 60 * 1000 : 10 * 60 * 1000;
  const dedupWindowStart = new Date(Date.now() - dedupWindowMs).toISOString();

  const { data: duplicates } = await supabase
    .from("notifications")
    .select("id, post_id")
    .eq("type", type)
    .eq("recipient_id", recipientId)
    .eq("actor_id", actorId)
    .gte("created_at", dedupWindowStart);

  const postIdVal = postId ?? null;
  const isDuplicate = (duplicates ?? []).some(
    (row) => (row.post_id == null && postIdVal == null) || row.post_id === postIdVal
  );
  if (isDuplicate) {
    return new Response(JSON.stringify({ ok: true, inserted: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("notifications").insert({
    type,
    recipient_id: recipientId,
    actor_id: actorId,
    post_id: postId ?? null,
  });

  if (error) {
    console.error("[notify] Insert failed", { message: error.message, code: error.code, type, actorId, recipientId, postId: postId ?? null });
    return new Response(JSON.stringify({ error: "Insert failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[notify] inserted", { type, recipientId, actorId });
  return new Response(JSON.stringify({ ok: true, inserted: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
