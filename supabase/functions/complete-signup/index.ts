// Phase 6-1: Complete signup with token. Creates Auth user + public.users, marks token used.
// Invoked with body: { token, name, password, role?, church?, bio?, affiliation? }.
// Auth: Bearer SUPABASE_SERVICE_ROLE_KEY (server-side only).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ROLES = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

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

  const auth = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceRoleKey || !supabaseUrl || auth !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { token?: string; name?: string; password?: string; role?: string; church?: string; bio?: string; affiliation?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || !name || password.length < 8) {
    return new Response(JSON.stringify({ error: "token, name, and password (min 8 chars) required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: tokenRow } = await admin
    .from("approval_tokens")
    .select("request_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow || tokenRow.used_at) {
    return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (new Date(tokenRow.expires_at) <= new Date()) {
    return new Response(JSON.stringify({ error: "Link expired" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: reqRow } = await admin
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation")
    .eq("id", tokenRow.request_id)
    .eq("status", "APPROVED")
    .single();

  if (!reqRow) {
    return new Response(JSON.stringify({ error: "Request not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = (reqRow.email as string).trim().toLowerCase();
  const role = body.role && ALLOWED_ROLES.includes(body.role) ? body.role : (reqRow.role as string);
  const church = typeof body.church === "string" ? body.church.trim() || null : (reqRow.church as string | null);
  const bio = typeof body.bio === "string" ? body.bio.trim() || null : (reqRow.bio as string | null);
  const affiliation = typeof body.affiliation === "string" ? body.affiliation.trim() || null : (reqRow.affiliation as string | null);

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const msg = createError.message || "";
    if (msg.includes("already been registered")) {
      return new Response(JSON.stringify({ error: "This email is already registered. Please sign in." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!authUser?.user?.id) {
    return new Response(JSON.stringify({ error: "Failed to create account" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: approvalCode } = await admin.from("invite_codes").select("id").eq("code", "APPROVAL").maybeSingle();
  const inviteCodeId = approvalCode?.id ?? null;
  if (!inviteCodeId) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: userErr } = await admin.from("users").insert({
    id: authUser.user.id,
    name: name || (reqRow.name as string) || "Member",
    role,
    church,
    bio,
    affiliation,
    username: null,
    invite_code_id: inviteCodeId,
  });

  if (userErr) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return new Response(JSON.stringify({ error: userErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();
  await admin.from("approval_tokens").update({ used_at: now }).eq("token", token);
  await admin.from("signup_requests").update({ status: "COMPLETED" }).eq("id", reqRow.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
