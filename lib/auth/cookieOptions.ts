/**
 * Single source for Supabase auth cookie options.
 * Used by: middleware, set-session-redirect, ensure-profile.
 * Same options everywhere = cookies persist across redirects and page changes.
 */
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function isHttps(request: NextRequest): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    // ignore
  }
  return request.headers.get("x-forwarded-proto") === "https";
}

export type AuthCookieOptions = {
  path: "/";
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
};

export function getAuthCookieOptions(request: NextRequest): AuthCookieOptions {
  return {
    path: "/",
    httpOnly: true,
    secure: isHttps(request),
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export function getRequestOrigin(request: NextRequest, fallback = "https://cellah.co.kr"): string {
  try {
    const u = new URL(request.url);
    if (u.origin && u.origin !== "null") return u.origin;
  } catch {
    // ignore
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? fallback.replace(/^https?:\/\//, "");
  const proto = request.headers.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host.split(",")[0]!.trim()}`;
}

/** Apply Supabase setAll items to a response with shared options. Strip domain so cookie is host-only. */
export function applySupabaseCookies(
  request: NextRequest,
  response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
): void {
  const base = getAuthCookieOptions(request);
  cookiesToSet.forEach(({ name, value, options }) => {
    const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
    // Our base options come LAST so they override Supabase's DEFAULT_COOKIE_OPTIONS
    // (which has httpOnly: false). This ensures httpOnly: true always wins.
    response.cookies.set(name, value, { ...rest, ...base });
  });
}
