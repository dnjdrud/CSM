/**
 * GET /api/auth/ensure-profile?next=/feed
 * Ensures public.users row exists for the current auth user, then redirects to ?next=.
 * Uses cookieStore.set() + NextResponse.redirect() — canonical pattern for reliable cookie delivery.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ensureProfile } from "@/lib/auth/ensureProfile";
import { isHttps, getRequestOrigin } from "@/lib/auth/cookieOptions";

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

  const cookieStore = await cookies();
  const secure = isHttps(request);

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
            // Our options come LAST so they override Supabase's DEFAULT_COOKIE_OPTIONS.httpOnly:false
            cookieStore.set(name, value, {
              ...rest,
              path: "/",
              httpOnly: true,
              secure,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
            });
          });
        } catch {
          // Silently ignore
        }
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.redirect(`${origin}/onboarding?from=${encodeURIComponent(safeNext)}&message=session_not_ready`);
  }

  await ensureProfile({ userId: user.id, email: user.email ?? undefined });
  return NextResponse.redirect(`${origin}${safeNext}`);
}
