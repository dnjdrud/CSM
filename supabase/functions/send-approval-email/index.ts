// Send approval email via Resend. Called from Next.js server (admin approve action).
// Secrets: RESEND_API_KEY, EMAIL_FROM (e.g. "CSM <no-reply@yourdomain.com>")

const SUBJECT = "Your access is approved — complete your signup";

function body(link: string): string {
  return `Your request to join has been approved. Complete your signup by opening the link below and setting your password.

${link}

This link expires in 7 days. If you didn't request access, you can ignore this email.`;
}

interface Payload {
  email: string;
  link: string;
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

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const link = typeof payload.link === "string" ? payload.link.trim() : "";
  if (!email || !link) {
    return new Response(JSON.stringify({ error: "Missing email or link" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? "CSM <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("[send-approval-email] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: SUBJECT,
      text: body(link),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[send-approval-email] Resend error", res.status, errText);
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
