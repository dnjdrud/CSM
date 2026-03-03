// Send invite code/link by email via Resend. Called from Next.js server (admin "Send link").
// Auth: Bearer SUPABASE_SERVICE_ROLE_KEY.
// Env: RESEND_API_KEY, EMAIL_FROM, APP_URL (or VERCEL_URL).
// Body: { toEmail, code, signInUrl, note?, expiresAt?, maxUses? }

const SUBJECT = "You're invited to CSM";

function buildBody(p: {
  code: string;
  signInUrl: string;
  note?: string | null;
  expiresAt?: string | null;
  maxUses?: number;
}): string {
  let text = `Hello,

You're invited to join CSM — a quiet digital space for prayer, Scripture, and testimony.

How to join:
• Open this link: ${p.signInUrl}
• Sign in with your email (you'll receive a sign-in link)
• Enter your invite code when prompted: ${p.code}
• Complete your profile

`;
  if (p.maxUses != null && p.maxUses > 0) {
    text += `This invite can be used ${p.maxUses} time(s).\n`;
  }
  if (p.expiresAt) {
    text += `It expires: ${p.expiresAt}\n`;
  }
  if (p.note?.trim()) {
    text += `Note: ${p.note.trim()}\n`;
  }
  text += `
If you have any trouble, reply to this email.

Warmly,
CSM`;
  return text;
}

interface Payload {
  toEmail: string;
  code: string;
  signInUrl: string;
  note?: string | null;
  expiresAt?: string | null;
  maxUses?: number;
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
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRole || auth !== `Bearer ${serviceRole}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const toEmail = typeof payload.toEmail === "string" ? payload.toEmail.trim() : "";
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  const signInUrl = typeof payload.signInUrl === "string" ? payload.signInUrl.trim() : "";
  if (!toEmail || !code || !signInUrl) {
    return new Response(JSON.stringify({ error: "Missing toEmail, code, or signInUrl" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "CSM <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("[send-invite-email] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = buildBody({
    code,
    signInUrl,
    note: payload.note ?? null,
    expiresAt: payload.expiresAt ?? null,
    maxUses: payload.maxUses ?? undefined,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: SUBJECT,
      text: body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[send-invite-email] Resend error", res.status, errText);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: errText }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
