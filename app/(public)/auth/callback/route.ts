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

const LOG_PREFIX = "[auth/callback]";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
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

  const isProduction = process.env.NODE_ENV === "production";
  const cookieDomain = isProduction ? ".cellah.co.kr" : undefined;
  const cookieOptions: { path: string; secure?: boolean; sameSite?: "lax" | "strict"; domain?: string; httpOnly?: boolean; maxAge?: number } = {
    path: "/",
    secure: isProduction,
    sameSite: "lax",
  };
  if (cookieDomain) cookieOptions.domain = cookieDomain;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...cookieOptions, ...options });
        });
      },
    },
  });

  try {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) {
        console.error(LOG_PREFIX, "exchangeCodeForSession failed", { message: error?.message });
        throw error ?? new Error("No user after exchangeCodeForSession");
      }
      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      await ensureProfile({ userId: data.user.id, email: data.user.email });
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
      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      await ensureProfile({ userId: data.user.id, email: data.user.email });
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
