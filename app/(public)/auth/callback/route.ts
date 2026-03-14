/**
 * Auth callback (Route Handler). Handles server-side flows only.
 * - ?code= (PKCE): exchangeCodeForSession, ensureProfile, redirect.
 * - ?token_hash=&type= (OTP): verifyOtp, ensureProfile, redirect.
 * - No code/token_hash: redirect to /auth/callback (client page) so hash fragment can be handled there.
 * Redirects use request.url as base so query params are preserved when needed.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { wrapSupabaseAuthSafe } from "@/lib/supabase/server";

const LOG_PREFIX = "[auth/callback]";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;

  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/feed";

  if (process.env.NODE_ENV !== "production") {
    console.log(LOG_PREFIX, {
      pathname,
      hasCode: Boolean(code),
      hasTokenHash: Boolean(token_hash),
      type: type ?? null,
      next,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const redirectTo = new URL("/onboarding", request.url);
    redirectTo.searchParams.set("error", "missing_env");
    return NextResponse.redirect(redirectTo);
  }

  const cookieStore = await cookies();
  const redirectTarget = new URL(next.startsWith("/") ? next : "/feed", request.url);
  const response = NextResponse.redirect(redirectTarget);

  const supabase = wrapSupabaseAuthSafe(createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { path: "/", ...options });
        });
      },
    },
  }));

  // Helper: allow access only if user was admin-approved.
  // Admin-allowlisted emails always pass. Others must have a public.users row (created during approval signup).
  // This prevents users who signed up directly via Supabase (bypassing our approval flow) from getting in.
  async function assertApprovedUser(userId: string, email: string | undefined): Promise<boolean> {
    const { isAdminEmail } = await import("@/lib/admin/bootstrap");
    if (isAdminEmail(email ?? "")) {
      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      await ensureProfile({ userId, email });
      return true;
    }
    // For regular users: profile row existence proves they went through our approval flow.
    // ensureProfile is NOT called here — we only check, never create for unapproved users.
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return false;
    const { data: profile } = await adminClient.from("users").select("id").eq("id", userId).maybeSingle();
    return !!profile;
  }

  try {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) {
        console.error(LOG_PREFIX, "exchangeCodeForSession failed", { message: error?.message });
        throw error ?? new Error("No user after exchangeCodeForSession");
      }
      const approved = await assertApprovedUser(data.user.id, data.user.email);
      if (!approved) {
        console.error(LOG_PREFIX, "unapproved user attempted access via callback code", { userId: data.user.id });
        await supabase.auth.signOut();
        const redirectTo = new URL("/onboarding", request.url);
        redirectTo.searchParams.set("error", "not_approved");
        return NextResponse.redirect(redirectTo);
      }
      return response;
    }

    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "magiclink" | "email",
      });
      if (error || !data.user) {
        console.error(LOG_PREFIX, "verifyOtp failed", { message: error?.message });
        throw error ?? new Error("No user after verifyOtp");
      }
      const approved = await assertApprovedUser(data.user.id, data.user.email);
      if (!approved) {
        console.error(LOG_PREFIX, "unapproved user attempted access via callback token_hash", { userId: data.user.id });
        await supabase.auth.signOut();
        const redirectTo = new URL("/onboarding", request.url);
        redirectTo.searchParams.set("error", "not_approved");
        return NextResponse.redirect(redirectTo);
      }
      return response;
    }

    // No code and no token_hash/type: fragment flow. Send to client page (hash not sent to server).
    const callbackPageUrl = new URL("/auth/callback/session", request.url);
    requestUrl.searchParams.forEach((value, key) => {
      callbackPageUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackPageUrl);
  } catch (e) {
    console.error(LOG_PREFIX, "callback failed", e);
    const redirectTo = new URL("/onboarding", request.url);
    redirectTo.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(redirectTo);
  }
}
