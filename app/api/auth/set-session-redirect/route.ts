/**
 * POST /api/auth/set-session-redirect
 * Body (form): access_token, refresh_token. Query: next (default /feed)
 * Sets session cookies via shared options (lib/auth/cookieOptions), then 200 + HTML redirect so CDN doesn’t strip Set-Cookie.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getRequestOrigin, applySupabaseCookies } from "@/lib/auth/cookieOptions";

function htmlRedirect(url: string): string {
  const safe = url.replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"></head><body><p>Redirecting...</p><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`;
}

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
  const redirectUrl = origin + safeNext;

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
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        applySupabaseCookies(request, response, cookiesToSet);
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

  return response;
}
