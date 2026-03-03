// Phase 6-1: Approve signup request. Creates token (7-day expiry), updates request, sends email.
// Invoked by admin with body: { requestId, adminUserId }.
// Auth: caller must pass Bearer SUPABASE_SERVICE_ROLE_KEY (server-side only).
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, APP_URL (e.g. https://yourapp.com)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUBJECT = "Your access is approved — complete your signup";

function emailBody(link: string): string {
  return `Your request to join has been approved. Complete your signup by opening the link below and setting your password.

${link}

This link expires in 7 days. If you didn't request access, you can ignore this email.`;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

  const auth = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceRoleKey || !supabaseUrl || auth !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { requestId?: string; adminUserId?: string };
  try {
    body = (await req.json()) as { requestId?: string; adminUserId?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const adminUserId = typeof body.adminUserId === "string" ? body.adminUserId.trim() : "";
  if (!requestId || !adminUserId) {
    return new Response(JSON.stringify({ error: "Missing requestId or adminUserId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: adminUser } = await admin.from("users").select("id, role").eq("id", adminUserId).single();
  if (!adminUser || adminUser.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: reqRow } = await admin
    .from("signup_requests")
    .select("id, email")
    .eq("id", requestId)
    .eq("status", "PENDING")
    .single();

  if (!reqRow) {
    return new Response(JSON.stringify({ error: "Request not found or not pending" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const token = generateToken();

  const { error: updateErr } = await admin
    .from("signup_requests")
    .update({
      status: "APPROVED",
      reviewed_at: now.toISOString(),
      reviewed_by: adminUserId,
      review_note: null,
    })
    .eq("id", requestId);

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: tokenErr } = await admin.from("approval_tokens").insert({
    request_id: requestId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenErr) {
    return new Response(JSON.stringify({ error: tokenErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appUrl = (Deno.env.get("APP_URL") || (Deno.env.get("VERCEL_URL") ? `https://${Deno.env.get("VERCEL_URL")}` : null) || "http://localhost:3000").replace(/\/$/, "");
  const link = `${appUrl}/auth/complete?token=${encodeURIComponent(token)}`;

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "CSM <onboarding@resend.dev>";
  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [reqRow.email],
        subject: SUBJECT,
        text: emailBody(link),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[approve-signup] Resend error", res.status, errText);
      return new Response(
        JSON.stringify({ error: "Approved but failed to send email", details: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(JSON.stringify({ ok: true, link }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
