/**
 * GET /api/auth/ensure-profile?next=/feed
 * Ensures public.users row exists for the current auth user, then redirects to ?next= (default /feed).
 * Used by middleware so logged-in users without a profile go here first and then to feed (no onboarding flash).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ensureProfile } from "@/lib/auth/ensureProfile";

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

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // no-op for this read-only flow; redirect will use existing cookies
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.redirect(origin + "/onboarding?from=" + encodeURIComponent(safeNext));
  }

  await ensureProfile({ userId: user.id, email: user.email ?? undefined });
  return NextResponse.redirect(origin + safeNext);
}
