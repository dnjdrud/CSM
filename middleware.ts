/**
 * Route guards. Never redirect /api/* or static assets.
 * Supabase SSR: single response, buffer cookiesToSet from setAll, apply to that response
 * (or to redirect response) with Supabase options only — do not override domain/maxAge.
 * Public: /, /login, /auth/callback, /privacy, /terms, /contact, etc.
 * App paths require session + profile; /admin requires session + role ADMIN.
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
    pathname.startsWith("/community") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/me") ||
    pathname.startsWith("/post/") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/topics") ||
    pathname.startsWith("/write")
  );
}

function isHttps(request: NextRequest): boolean {
  try {
    if (new URL(request.url).protocol === "https:") return true;
  } catch {
    // ignore
  }
  return request.headers.get("x-forwarded-proto") === "https";
}

/** Apply Supabase cookies with Secure + SameSite=Lax so they persist on next navigation (HTTPS). */
function applyCookiesToResponse(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
): void {
  const secure = isHttps(request);
  const base = { path: "/" as const, httpOnly: true, secure, sameSite: "lax" as const };
  cookiesToSet.forEach(({ name, value, options }) => {
    const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
    response.cookies.set(name, value, { ...base, ...rest });
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  const secure = isHttps(request);
  const cookieBase = { path: "/" as const, httpOnly: true, secure, sameSite: "lax" as const };
  const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach((c) => cookiesToSet.push(c));
        toSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          response.cookies.set(name, value, { ...cookieBase, ...rest });
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isOnboardingOrRequestAccessPath(pathname)) {
    if (!user) return response;
    const { data: roleRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (roleRow?.role === "ADMIN") return response;
    const redirectResponse = NextResponse.redirect(new URL("/feed", request.url));
    applyCookiesToResponse(request, redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (!user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login?from=" + encodeURIComponent(pathname), request.url)
    );
    applyCookiesToResponse(request, redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (isAdminPath(pathname)) {
    if (user.email && isAdminEmail(user.email)) return response;
    const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (row?.role !== "ADMIN") {
      const redirectResponse = NextResponse.redirect(new URL("/feed?message=admin_required", request.url));
      applyCookiesToResponse(request, redirectResponse, cookiesToSet);
      return redirectResponse;
    }
    return response;
  }

  if (isAppPath(pathname)) {
    const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      // Logged-in but no profile: ensure profile then go to app.
      const redirectResponse = NextResponse.redirect(
        new URL("/api/auth/ensure-profile?next=" + encodeURIComponent(pathname), request.url)
      );
      applyCookiesToResponse(request, redirectResponse, cookiesToSet);
      return redirectResponse;
    }
    try {
      const { data: deact } = await supabase.from("users").select("deactivated_at").eq("id", user.id).maybeSingle();
      if (deact?.deactivated_at) {
        const isOwnProfile = pathname === `/profile/${user.id}` || pathname.startsWith(`/profile/${user.id}/`);
        if (!isOwnProfile) {
          const redirectResponse = NextResponse.redirect(new URL("/?message=account_deactivated", request.url));
          applyCookiesToResponse(request, redirectResponse, cookiesToSet);
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
