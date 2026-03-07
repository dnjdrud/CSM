/**
 * Route guards. Never redirect /api/* or static assets.
 * Supabase SSR: single response, buffer cookiesToSet from setAll, apply to that response
 * (or to redirect response) with Supabase options only — do not override domain/maxAge.
 * Public: /, /login, /onboarding, /request-access, /auth/callback, /auth/complete, etc.
 * App paths require session + profile; /admin requires session + role ADMIN.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/bootstrap";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";

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

  // getSession() reads from cookies locally — no network call for valid tokens.
  // getUser() makes a network round-trip to Supabase on EVERY request, which can
  // fail transiently and cause spurious logouts on navigation.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (isOnboardingOrRequestAccessPath(pathname)) {
    if (!user) return response;
    const { data: roleRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    // No profile row → user needs to complete onboarding; let them through.
    // Only redirect to /feed when we know they already have a completed profile.
    if (!roleRow) return response;
    if (roleRow.role === "ADMIN") return response;
    const redirectResponse = NextResponse.redirect(new URL("/feed", request.url));
    applyCookiesToResponse(redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (!user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/onboarding?from=" + encodeURIComponent(pathname), request.url)
    );
    applyCookiesToResponse(redirectResponse, cookiesToSet);
    return redirectResponse;
  }
  if (isAdminPath(pathname)) {
    if (user.email && isAdminEmail(user.email)) return response;
    const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (row?.role !== "ADMIN") {
      const redirectResponse = NextResponse.redirect(new URL("/feed?message=admin_required", request.url));
      applyCookiesToResponse(redirectResponse, cookiesToSet);
      return redirectResponse;
    }
    return response;
  }
  if (isAppPath(pathname)) {
    const { data: profile, error: profileError } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
    // Only redirect when the query succeeded and definitively found no profile.
    // If there was a DB/network error, allow access rather than risking a false redirect.
    if (!profile && !profileError) {
      if (user.email && isOnboardingBypassEmail(user.email)) return response;
      const redirectResponse = NextResponse.redirect(
        new URL("/onboarding?from=" + encodeURIComponent(pathname), request.url)
      );
      applyCookiesToResponse(redirectResponse, cookiesToSet);
      return redirectResponse;
    }
    try {
      const { data: deact } = await supabase.from("users").select("deactivated_at").eq("id", user.id).maybeSingle();
      if (deact?.deactivated_at) {
        const isOwnProfile = pathname === `/profile/${user.id}` || pathname.startsWith(`/profile/${user.id}/`);
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
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
