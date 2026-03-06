/**
 * POST /api/auth/set-session-redirect
 * Body (form): access_token, refresh_token. Query: next (default /feed)
 * Sets session cookies directly on the redirect response so they are guaranteed
 * to be included in the 302 headers regardless of cookieStore merge behavior.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isHttps, getRequestOrigin } from "@/lib/auth/cookieOptions";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/login?error=invalid", getRequestOrigin(request)), { status: 302 });
  }

  const form = await request.formData();
  const access_token = form.get("access_token") as string | null;
  const refresh_token = form.get("refresh_token") as string | null;

  if (!access_token?.trim() || !refresh_token?.trim()) {
    return NextResponse.redirect(new URL("/login?error=missing_tokens", getRequestOrigin(request)), { status: 302 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=config", getRequestOrigin(request)), { status: 302 });
  }

  const nextParam = request.nextUrl.searchParams.get("next") ?? "/feed";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/feed";
  const origin = getRequestOrigin(request);
  const redirectUrl = `${origin}${safeNext}`;

  const cookieStore = await cookies();
  const secure = isHttps(request);

  // Collect cookies from setSession so we can apply them directly to the response.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const c of cookiesToSet) {
          pendingCookies.push({ name: c.name, value: c.value, options: (c.options ?? {}) as Record<string, unknown> });
        }
      },
    },
  });

  const { error } = await supabase.auth.setSession({
    access_token: access_token.trim(),
    refresh_token: refresh_token.trim(),
  });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=session", origin), { status: 302 });
  }

  // Apply cookies directly to the redirect response — guaranteed delivery.
  const response = NextResponse.redirect(redirectUrl, { status: 302 });
  for (const { name, value, options } of pendingCookies) {
    const { domain: _d, ...rest } = options;
    // Our options come LAST so they override Supabase's DEFAULT_COOKIE_OPTIONS.httpOnly:false
    response.cookies.set(name, value, {
      ...rest,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}
