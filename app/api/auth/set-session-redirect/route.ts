/**
 * POST /api/auth/set-session-redirect
 * Body (form): access_token, refresh_token. Query: next (default /feed)
 * Uses cookieStore.set() (next/headers) + NextResponse.redirect() — the canonical Supabase SSR
 * pattern. Ensures httpOnly session cookies are set and persist across ALL navigations.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isHttps, getRequestOrigin } from "@/lib/auth/cookieOptions";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/login?error=invalid", getRequestOrigin(request)), 302);
  }

  const form = await request.formData();
  const access_token = form.get("access_token") as string | null;
  const refresh_token = form.get("refresh_token") as string | null;

  if (!access_token?.trim() || !refresh_token?.trim()) {
    return NextResponse.redirect(new URL("/login?error=missing_tokens", getRequestOrigin(request)), 302);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=config", getRequestOrigin(request)), 302);
  }

  const nextParam = request.nextUrl.searchParams.get("next") ?? "/feed";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/feed";
  const origin = getRequestOrigin(request);
  const redirectUrl = `${origin}${safeNext}`;

  const cookieStore = await cookies();
  const secure = isHttps(request);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // cookieStore.set() + NextResponse.redirect() = canonical pattern.
        // Next.js merges these cookies into the outgoing redirect response.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
            cookieStore.set(name, value, {
              path: "/",
              httpOnly: true,
              secure,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
              ...rest,
            });
          });
        } catch {
          // Silently ignore
        }
      },
    },
  });

  const { error } = await supabase.auth.setSession({
    access_token: access_token.trim(),
    refresh_token: refresh_token.trim(),
  });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=session", origin), 302);
  }

  return NextResponse.redirect(redirectUrl);
}
