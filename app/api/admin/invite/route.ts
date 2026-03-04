/**
 * POST /api/admin/invite — Send invite email (승인제 플로우: 관리자가 이메일로 초대 링크 발송).
 * Body: { email: string }
 * Admin only (getAdminOrNull). Creates invite in auth_invites (token_hash), sends Resend email with link.
 */
import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/admin/guard";
import { createInvite } from "@/lib/auth/invites";
import { sendInviteEmail } from "@/lib/email/send";

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
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const result = await createInvite(email, admin.userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const baseUrl = getBaseUrl(request);
  const inviteUrl = `${baseUrl}/onboarding?token=${encodeURIComponent(result.rawToken)}`;

  try {
    await sendInviteEmail(email, inviteUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
