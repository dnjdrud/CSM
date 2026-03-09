/**
 * Route guards. Never redirect /api/* or static assets.
 * Supabase SSR: single response, buffer cookiesToSet from setAll, apply to that response
 * (or to redirect response) with Supabase options only — do not override domain/maxAge.
 * Public: /, /login, /onboarding, /request-access, /auth/callback, /auth/complete, etc.
 * App paths require session + profile; /admin requires session + role ADMIN.
 *
 * Auth strategy:
 * 1. Try supabase.auth.getSession() (handles token refresh for near-expiry tokens).
 * 2. If SDK fails but auth cookies exist, fall back to direct JWT parsing (no network call).
 *    This prevents false redirects when the SDK's refresh attempt races with the browser
 *    client's auto-refresh (browser consumes the refresh token first → SDK gets an error
 *    and calls _removeSession() internally, which would clear cookies if we applied
 *    cookiesToSet to the redirect response).
 * 3. On unauthenticated redirect: NEVER apply cookiesToSet — doing so would forward
 *    the SDK's cookie-deletion headers to the browser and permanently erase valid tokens
 *    the browser client may have just refreshed.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/bootstrap";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/onboarding",
  "/onboarding/complete",
  "/request-access",
  "/principles",
  "/support",
  "/auth/callback",
  "/auth/complete",
  "/privacy",
  "/terms",
  "/contact",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isOnboardingOrRequestAccessPath(pathname: string): boolean {
  return (
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/request-access" ||
    pathname.startsWith("/request-access/")
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/feed") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/me") ||
    pathname.startsWith("/post/") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/topics") ||
    pathname.startsWith("/write")
  );
}

/** Apply Supabase cookiesToResponse; host-only (no domain) so SA and RSC see session. */
function applyCookiesToResponse(
  response: NextResponse,
  cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
): void {
  cookiesToSet.forEach(({ name, value, options }) => {
    const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
    response.cookies.set(name, value, { path: "/", ...rest });
  });
}

/**
 * Decode a base64url string to a UTF-8 string.
 * Uses atob + TextDecoder to handle multi-byte characters correctly.
 */
function decodeBase64URL(str: string): string | null {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "==".slice(0, (4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Fallback: parse user ID directly from the Supabase auth cookie without SDK.
 * Avoids _callRefreshToken() network calls and _removeSession() cookie clearing.
 * Returns the user ID (JWT "sub") if the access token is present and not yet expired.
 * Returns null if no cookie, can't parse, or token is genuinely expired.
 */
function getUserIdFromCookies(request: NextRequest): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;
    const allCookies = request.cookies.getAll();

    // Find auth cookie (single or chunked: .0, .1, …)
    let cookieValue = "";
    const single = allCookies.find((c) => c.name === cookieName);
    if (single) {
      cookieValue = single.value;
    } else {
      for (let i = 0; ; i++) {
        const chunk = allCookies.find((c) => c.name === `${cookieName}.${i}`);
        if (!chunk) break;
        cookieValue += chunk.value;
      }
    }

    if (!cookieValue) return null;

    // Decode @supabase/ssr v0.8.0 base64url-encoded value
    let sessionStr: string;
    if (cookieValue.startsWith("base64-")) {
      const decoded = decodeBase64URL(cookieValue.slice(7));
      if (!decoded) return null;
      sessionStr = decoded;
    } else {
      sessionStr = cookieValue;
    }

    const session = JSON.parse(sessionStr) as {
      access_token?: string;
      expires_at?: number;
    };
    if (!session.access_token || !session.expires_at) return null;

    // Only treat as valid if the access token has NOT actually expired yet.
    // (The SDK's EXPIRY_MARGIN_MS=90s check is what causes it to try a refresh
    // that can fail; we skip that margin here and let the RSC handle near-expiry.)
    if (session.expires_at * 1000 < Date.now()) return null;

    // Decode JWT payload to get user ID
    const parts = session.access_token.split(".");
    if (parts.length !== 3) return null;
    const payloadStr = decodeBase64URL(parts[1]);
    if (!payloadStr) return null;
    const payload = JSON.parse(payloadStr) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/auth")) return NextResponse.next();
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  if (!isOnboardingOrRequestAccessPath(pathname) && isPublicPath(pathname)) return NextResponse.next();

  // Do NOT early-return for Server Action (Next-Action): SA requests must run auth refresh so getSession() sees session.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        toSet.forEach((c) => cookiesToSet.push(c));
        // Update request cookies so server components see the refreshed token.
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Recreate response with updated request headers, then apply cookies.
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          response.cookies.set(name, value, { path: "/", ...rest });
        });
      },
    },
  });

  // Primary: try Supabase SDK getSession() — handles token refresh for near-expiry tokens.
  // getUser() makes a network round-trip to Supabase on EVERY request and triggers
  // auto-signout on auth errors, so we always use getSession() here.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  let user = session?.user ?? null;

  // Fallback: if SDK failed but auth cookies are present and JWT is still valid,
  // parse the user ID directly from the cookie. This handles the race condition where
  // the browser client's autoRefreshToken fires and consumes the refresh token just
  // before middleware's _callRefreshToken attempt, causing SDK to return null and
  // internally call _removeSession() (which would queue cookie-deletion in cookiesToSet).
  let usedFallback = false;
  let fallbackUserId: string | null = null;
  if (!user) {
    fallbackUserId = getUserIdFromCookies(request);
    if (fallbackUserId) {
      usedFallback = true;
    }
    const sbCookieNames = request.cookies.getAll().filter((c) => c.name.startsWith("sb-")).map((c) => c.name);
    console.warn(
      "[middleware]", pathname,
      "| sdkSession: null",
      "| fallbackUserId:", fallbackUserId ?? "null",
      "| sbCookies:", sbCookieNames,
      "| sdkError:", sessionError?.message ?? null
    );
  }

  // Determine effective user ID for route checks
  const effectiveUserId = user?.id ?? fallbackUserId ?? null;

  if (isOnboardingOrRequestAccessPath(pathname)) {
    if (!effectiveUserId) return response;
    // Only use DB check when SDK session is available (has auth for RLS queries).
    if (user) {
      const { data: roleRow } = await supabase.from("users").select("role").eq("id", user.id).single();
      // No profile row → user needs to complete onboarding; let them through.
      // Only redirect to /feed when we know they already have a completed profile.
      if (!roleRow) return response;
      if (roleRow.role === "ADMIN") return response;
    }
    const redirectResponse = NextResponse.redirect(new URL("/feed", request.url));
    applyCookiesToResponse(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (!effectiveUserId) {
    const redirectResponse = NextResponse.redirect(
      new URL("/onboarding?from=" + encodeURIComponent(pathname), request.url)
    );
    // IMPORTANT: Do NOT apply cookiesToSet to this redirect.
    // If the SDK's getSession() triggered a failed refresh, _removeSession() was called
    // internally, which queues cookie-deletion in cookiesToSet via SIGNED_OUT → applyServerStorage.
    // Applying those deletions here would erase the browser's valid session cookies
    // (e.g. freshly auto-refreshed by the browser client) → permanent logout.
    return redirectResponse;
  }

  if (isAdminPath(pathname)) {
    // In fallback mode we can't verify admin safely (Supabase client has no session for RLS).
    // Deny admin access in fallback; the RSC will re-check after the browser refreshes.
    if (usedFallback) {
      const redirectResponse = NextResponse.redirect(new URL("/feed?message=admin_required", request.url));
      return redirectResponse;
    }
    if (user!.email && isAdminEmail(user!.email)) return response;
    const { data: row } = await supabase.from("users").select("role").eq("id", user!.id).single();
    if (row?.role !== "ADMIN") {
      const redirectResponse = NextResponse.redirect(new URL("/feed?message=admin_required", request.url));
      applyCookiesToResponse(redirectResponse, cookiesToSet);
      return redirectResponse;
    }
    return response;
  }

  if (isAppPath(pathname)) {
    // Profile existence is checked at the page level (getCurrentUser → redirect).
    // Middleware only enforces authentication (done above via !effectiveUserId check).
    // In fallback mode, skip deactivated check — RSC handles it.
    if (!usedFallback) {
      try {
        const { data: deact } = await supabase.from("users").select("deactivated_at").eq("id", user!.id).maybeSingle();
        if (deact?.deactivated_at) {
          const isOwnProfile = pathname === `/profile/${user!.id}` || pathname.startsWith(`/profile/${user!.id}/`);
          if (!isOwnProfile) {
            const redirectResponse = NextResponse.redirect(new URL("/?message=account_deactivated", request.url));
            applyCookiesToResponse(redirectResponse, cookiesToSet);
            return redirectResponse;
          }
        }
      } catch {
        // deactivated_at column may not exist yet; allow access
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
