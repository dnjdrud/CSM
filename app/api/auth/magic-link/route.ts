/**
 * POST /api/auth/magic-link — Generate a Supabase magic link via admin API and send via Resend.
 * Body: { email: string }
 * Uses admin.auth.admin.generateLink() — no PKCE, no auth_magic_links table needed.
 * The link in the email is a Supabase verify URL that redirects to /auth/callback after verification.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email/send";
import { getBaseUrlForLinks } from "@/lib/url/site";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const baseUrl = getBaseUrlForLinks(request);
  const redirectTo = `${baseUrl}/auth/callback`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    console.error("[magic-link] generateLink failed", error?.message);
    return NextResponse.json({ error: error?.message ?? "Failed to generate link" }, { status: 400 });
  }

  try {
    await sendMagicLinkEmail(email, data.properties.action_link);
  } catch (sendErr) {
    console.error("[magic-link] sendMagicLinkEmail failed", sendErr);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
