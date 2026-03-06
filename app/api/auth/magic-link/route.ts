/**
 * POST /api/auth/magic-link — Send magic link email (passwordless login).
 * Body: { email: string }
 * Creates row in auth_magic_links (token_hash), sends Resend email. Link: /auth/verify-magic?id=id&token=rawToken
 */
import { NextResponse } from "next/server";
import { createMagicLink } from "@/lib/auth/magicLink";
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

  const result = await createMagicLink(email);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const baseUrl = getBaseUrlForLinks(request);
  const loginUrl = `${baseUrl}/auth/verify-magic?id=${encodeURIComponent(result.id)}&token=${encodeURIComponent(result.rawToken)}`;

  try {
    await sendMagicLinkEmail(email, loginUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
