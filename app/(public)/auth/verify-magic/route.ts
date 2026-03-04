/**
 * GET /auth/verify-magic?id=uuid&token=rawToken
 * Consumes magic link token, then redirects to Supabase-generated sign-in link (session cookie set by Supabase redirect).
 */
import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magicLink";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id || !token) {
    const base = request.url.split("?")[0].replace(/\/auth\/verify-magic.*/, "") || "http://localhost:3000";
    return NextResponse.redirect(`${base}/login?error=missing_params`);
  }

  const result = await consumeMagicLink(id, token);
  if (!result) {
    const base = request.url.split("?")[0].replace(/\/auth\/verify-magic.*/, "") || "http://localhost:3000";
    return NextResponse.redirect(`${base}/login?error=invalid_or_expired`);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    const base = request.url.split("?")[0].replace(/\/auth\/verify-magic.*/, "") || "http://localhost:3000";
    return NextResponse.redirect(`${base}/login?error=server_error`);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    new URL(request.url).origin;
  const redirectTo = `${baseUrl.replace(/\/$/, "")}/feed`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: result.email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    const base = new URL(request.url).origin;
    return NextResponse.redirect(`${base}/login?error=link_failed`);
  }

  const actionLink = String(data.properties.action_link);
  const link = actionLink.startsWith("http") ? actionLink : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""}${actionLink.startsWith("/") ? "" : "/"}${actionLink}`;
  return NextResponse.redirect(link);
}
