/**
 * Route guards. Never redirect /api/* or static assets.
 * Uses Supabase SSR pattern: one response object, setAll writes to it, return that response
 * (or copy its cookies to redirect response) so session refresh is always sent to the browser.
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

/** Paths where logged-in non-ADMIN users are redirected to /feed; ADMIN is allowed through. */
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

function isServerActionRequest(request: NextRequest): boolean {
  return request.headers.get("Next-Action") != null;
}

/** Copy all cookies from one response to another (e.g. so redirect still sends refreshed session). */
function copyCookiesToResponse(
  from: NextResponse,
  to: NextResponse,
  cookieDomain?: string
): void {
  const list = from.cookies.getAll();
  const opts: { path: string; secure?: boolean; sameSite?: "lax" | "strict"; domain?: string; httpOnly?: boolean; maxAge?: number } = {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  if (cookieDomain) opts.domain = cookieDomain;
  list.forEach((c) => {
    to.cookies.set(c.name, c.value, { ...opts, maxAge: 60 * 60 * 24 * 7 });
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
  if (isServerActionRequest(request)) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  // Single response object so setAll() writes go to the response we return
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { path: "/", ...options })
        );
      },
    },
  });

  // Refresh session (may call setAll); then get user
  const { data: { user } } = await supabase.auth.getUser();

  // /onboarding, /request-access: allow unauthenticated; allow ADMIN; redirect other logged-in users to /feed
  if (isOnboardingOrRequestAccessPath(pathname)) {
    if (!user) return response;
    const { data: roleRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (roleRow?.role === "ADMIN") return response;
    const to = new URL("/feed", request.url);
    const redirectResponse = NextResponse.redirect(to);
    copyCookiesToResponse(response, redirectResponse, process.env.NODE_ENV === "production" ? ".cellah.co.kr" : undefined);
    return redirectResponse;
  }

  if (!user) {
    const to = new URL("/request-access", request.url);
    to.searchParams.set("from", pathname);
    const redirectResponse = NextResponse.redirect(to);
    copyCookiesToResponse(response, redirectResponse, process.env.NODE_ENV === "production" ? ".cellah.co.kr" : undefined);
    return redirectResponse;
  }
  if (isAdminPath(pathname)) {
    if (user.email && isAdminEmail(user.email)) return response;
    const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (row?.role !== "ADMIN") {
      const to = new URL("/feed", request.url);
      to.searchParams.set("message", "admin_required");
      const redirectResponse = NextResponse.redirect(to);
      copyCookiesToResponse(response, redirectResponse, process.env.NODE_ENV === "production" ? ".cellah.co.kr" : undefined);
      return redirectResponse;
    }
    return response;
  }
  if (isAppPath(pathname)) {
    const { data: profile } = await supabase.from("users").select("id, deactivated_at").eq("id", user.id).maybeSingle();
    if (!profile) {
      if (user.email && isOnboardingBypassEmail(user.email)) return response;
      const to = new URL("/request-access", request.url);
      to.searchParams.set("from", pathname);
      const redirectResponse = NextResponse.redirect(to);
      copyCookiesToResponse(response, redirectResponse, process.env.NODE_ENV === "production" ? ".cellah.co.kr" : undefined);
      return redirectResponse;
    }
    if (profile.deactivated_at) {
      const isOwnProfile = pathname === `/profile/${user.id}` || pathname.startsWith(`/profile/${user.id}/`);
      if (!isOwnProfile) {
        const to = new URL("/", request.url);
        to.searchParams.set("message", "account_deactivated");
        const redirectResponse = NextResponse.redirect(to);
        copyCookiesToResponse(response, redirectResponse, process.env.NODE_ENV === "production" ? ".cellah.co.kr" : undefined);
        return redirectResponse;
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
