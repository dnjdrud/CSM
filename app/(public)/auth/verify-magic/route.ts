/**
 * GET /auth/verify-magic?id=uuid&token=rawToken
 *
 * Validates the custom magic link, then uses Supabase Admin to generate a
 * one-time hashed_token and immediately verifies it SERVER-SIDE with a
 * createServerClient. The resulting session cookies are set directly on the
 * redirect response — no client-side JS, no window.location, no browser
 * setSession() race condition.
 *
 * Flow:
 *   1. Validate custom DB token → get email
 *   2. Admin generateLink → hashed_token (consumed server-side, never sent to browser)
 *   3. createServerClient.auth.verifyOtp({ token_hash }) → session
 *   4. Collect cookies via setAll(), apply to redirect → /feed
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { consumeMagicLink } from "@/lib/auth/magicLink";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id || !token) {
    return NextResponse.redirect(`${origin}/login?error=missing_params`);
  }

  // Step 1: verify our custom magic link (DB token)
  const result = await consumeMagicLink(id, token);
  if (!result) {
    console.log("verify-magic: consumeMagicLink failed for id:", id);
    return NextResponse.redirect(`${origin}/login?error=invalid_or_expired`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = getSupabaseAdmin();
  if (!admin || !supabaseUrl || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }

  // Step 2: generate a Supabase magic link server-side to get the hashed_token.
  // We do NOT redirect the user to action_link — we consume the token ourselves.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: result.email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.log("verify-magic: generateLink failed for email:", result.email, "error:", linkError);
    return NextResponse.redirect(`${origin}/login?error=link_failed`);
  }

  // Step 3: verify OTP server-side to obtain session tokens.
  // createServerClient buffers cookie writes via setAll(); no existing cookies needed.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options: (options ?? {}) as Record<string, unknown> });
        });
      },
    },
  });

  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError || !sessionData?.session) {
    console.log("verify-magic: verifyOtp failed for email:", result.email, "error:", verifyError);
    return NextResponse.redirect(`${origin}/login?error=verify_failed`);
  }

  // Step 4: ensure a profile row exists (idempotent). Must complete before redirect
  // so the middleware's profile check in isAppPath passes on the very first /feed load.
  try {
    const { ensureProfile } = await import("@/lib/auth/ensureProfile");
    await ensureProfile({
      userId: sessionData.session.user.id,
      email: sessionData.session.user.email,
    });
  } catch (e) {
    console.log("verify-magic: ensureProfile failed for userId:", sessionData.session.user.id, "error:", e);
    // Continue anyway, as profile creation might fail but auth should still work
  }

  // Step 5: apply session cookies to the redirect response.
  // Keep Supabase's DEFAULT_COOKIE_OPTIONS (httpOnly:false, sameSite:lax) so the
  // browser client can also read them for client-side auth state.
  const redirectResponse = NextResponse.redirect(`${origin}/feed`);
  for (const { name, value, options } of pendingCookies) {
    const { domain: _d, ...rest } = options;
    redirectResponse.cookies.set(name, value, { path: "/", ...rest } as Parameters<typeof redirectResponse.cookies.set>[2]);
  }
  return redirectResponse;
}
