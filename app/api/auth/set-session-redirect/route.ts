/**
 * POST /api/auth/set-session-redirect
 * Body (form): access_token, refresh_token. Query: next (default /feed)
 * Sets session cookies and returns 200 + HTML that immediately redirects.
 * 200 ensures CDN/proxies don't drop Set-Cookie (some strip it from 302). Browser applies cookies then navigates.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isHttps(request: NextRequest): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    // ignore
  }
  return request.headers.get("x-forwarded-proto") === "https";
}

function getOrigin(request: NextRequest): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://cellah.co.kr";
  }
}

function htmlRedirect(url: string): string {
  const safe = url.replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"></head><body><p>Redirecting...</p><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/login?error=invalid", getOrigin(request)), 302);
  }

  const form = await request.formData();
  const access_token = form.get("access_token") as string | null;
  const refresh_token = form.get("refresh_token") as string | null;

  if (!access_token?.trim() || !refresh_token?.trim()) {
    return NextResponse.redirect(new URL("/login?error=missing_tokens", getOrigin(request)), 302);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=config", getOrigin(request)), 302);
  }

  const nextParam = request.nextUrl.searchParams.get("next") ?? "/feed";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/feed";
  const origin = getOrigin(request);
  const redirectUrl = origin + safeNext;

  const secure = isHttps(request);
  const cookieOpts = {
    path: "/" as const,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  };

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
        cookiesToSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          response.cookies.set(name, value, { ...cookieOpts, ...rest });
        });
      },
    },
  });

  const { error } = await supabase.auth.setSession({ access_token: access_token.trim(), refresh_token: refresh_token.trim() });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=session", origin), 302);
  }

  return response;
}
