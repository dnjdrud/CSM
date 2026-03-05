/**
 * GET /api/auth/ensure-profile?next=/feed
 * Ensures public.users row exists for the current auth user, then redirects to ?next= (default /feed).
 * Writes Supabase cookies to the redirect response (Secure + SameSite=Lax) so session persists on next request.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureProfile } from "@/lib/auth/ensureProfile";

function isHttps(request: NextRequest): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    // ignore
  }
  return request.headers.get("x-forwarded-proto") === "https";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get("next") ?? "/feed";
  const safeNext = nextPath.startsWith("/") ? nextPath : "/feed";
  const origin = requestUrl.origin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(origin + "/onboarding?error=server_config");
  }

  const secure = isHttps(request);
  const cookieBase = { path: "/" as const, httpOnly: true, secure, sameSite: "lax" as const };

  const redirectToApp = NextResponse.redirect(origin + safeNext);
  const redirectToOnboarding = NextResponse.redirect(
    origin + "/onboarding?from=" + encodeURIComponent(safeNext) + "&message=session_not_ready"
  );

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          redirectToApp.cookies.set(name, value, { ...cookieBase, ...rest });
          redirectToOnboarding.cookies.set(name, value, { ...cookieBase, ...rest });
        });
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    return redirectToOnboarding;
  }

  await ensureProfile({ userId: user.id, email: user.email ?? undefined });
  return redirectToApp;
}
