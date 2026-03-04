/**
 * POST /api/auth/magic-link — Send magic link email (passwordless login).
 * Body: { email: string }
 * Creates row in auth_magic_links (token_hash), sends Resend email. Link: /auth/verify-magic?id=id&token=rawToken
 */
import { NextResponse } from "next/server";
import { createMagicLink } from "@/lib/auth/magicLink";
import { sendMagicLinkEmail } from "@/lib/email/send";

/** Base URL for magic link. Prefer NEXT_PUBLIC_SITE_URL (e.g. https://cellah.co.kr) so links don't use *.vercel.app and hit Vercel Deployment Protection login. */
function getBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL;
  if (env) return env.startsWith("http") ? env.replace(/\/+$/, "") : `https://${env}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

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

  const baseUrl = getBaseUrl(request);
  const loginUrl = `${baseUrl}/auth/verify-magic?id=${encodeURIComponent(result.id)}&token=${encodeURIComponent(result.rawToken)}`;

  try {
    await sendMagicLinkEmail(email, loginUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
