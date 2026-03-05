/**
 * Auth callback (Route Handler). Handles server-side flows only.
 * - ?code= (PKCE): exchangeCodeForSession, ensureProfile, 200+HTML redirect.
 * - ?token_hash=&type= (OTP/magic link): verifyOtp, ensureProfile, 200+HTML redirect.
 * - No code/token_hash: redirect to /auth/callback/session so hash fragment can be handled client-side.
 *
 * Uses 200+HTML (not 302) so CDN/Vercel does not strip Set-Cookie headers.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isHttps } from "@/lib/auth/cookieOptions";

const LOG_PREFIX = "[auth/callback]";

function htmlRedirect(url: string): string {
  const safe = url.replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"></head><body><p>Redirecting...</p><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`;
}

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
  const redirectPath = next.startsWith("/") ? next : "/feed";
  const redirectUrl = `${origin}${redirectPath}`;
  const secure = isHttps(request);

  // Use 200+HTML so CDN/Vercel does not strip Set-Cookie on redirects.
  const response = new NextResponse(htmlRedirect(redirectUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          response.cookies.set(name, value, {
            path: "/",
            httpOnly: true,
            secure,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            ...rest,
          });
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
