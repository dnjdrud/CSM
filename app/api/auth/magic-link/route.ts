/**
 * POST /api/auth/magic-link — Generate a magic link via Supabase admin API and send via Resend.
 * Body: { email: string }
 *
 * Links to /auth/callback/session (client-side) so email scanners (Gmail, Outlook, etc.)
 * don't consume the one-time token. Email scanners follow HTTP redirects but don't execute JS.
 * The browser's JS calls verifyOtp, and @supabase/ssr's createBrowserClient stores the session
 * in document.cookie — readable by the SSR middleware.
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

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${baseUrl}/auth/callback` },
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("[magic-link] generateLink failed", error?.message);
    return NextResponse.json({ error: error?.message ?? "Failed to generate link" }, { status: 400 });
  }

  // Client-side page: browser JS calls verifyOtp (email scanners don't run JS → token not consumed).
  const magicUrl =
    `${baseUrl}/auth/callback/session?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink&next=${encodeURIComponent("/feed")}`;

  try {
    await sendMagicLinkEmail(email, magicUrl);
  } catch (sendErr) {
    console.error("[magic-link] sendMagicLinkEmail failed", sendErr);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
