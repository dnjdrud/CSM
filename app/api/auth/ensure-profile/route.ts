/**
 * GET /api/auth/ensure-profile?next=/feed
 * Ensures public.users row exists for the current auth user, then redirects to ?next=.
 * Uses shared cookie options (lib/auth/cookieOptions) so session persists.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureProfile } from "@/lib/auth/ensureProfile";
import { getRequestOrigin, applySupabaseCookies } from "@/lib/auth/cookieOptions";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get("next") ?? "/feed";
  const safeNext = nextPath.startsWith("/") ? nextPath : "/feed";
  const origin = getRequestOrigin(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(origin + "/onboarding?error=server_config");
  }

  const redirectToApp = NextResponse.redirect(origin + safeNext);
  const redirectToOnboarding = NextResponse.redirect(
    origin + "/onboarding?from=" + encodeURIComponent(safeNext) + "&message=session_not_ready"
  );

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        applySupabaseCookies(request, redirectToApp, cookiesToSet);
        applySupabaseCookies(request, redirectToOnboarding, cookiesToSet);
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
