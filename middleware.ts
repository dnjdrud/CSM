/**
 * Route guards. Never redirect /api/* or static assets.
 * Public: /, /login, /onboarding, /request-access, /auth/callback, /auth/complete
 * (and /api/auth/complete, /api/debug/*, /api/notifications/unread-count are skipped via /api early return).
 * App paths (/feed, /profile, /me, /post, ...) require session + profile.
 * Admin (/admin) requires session + role ADMIN.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/bootstrap";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";

/** Paths that do not require authentication. */
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

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** App paths that require authenticated session (and profile). */
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

/** Next.js sends this header for Server Action POSTs. Do not redirect. */
function isServerActionRequest(request: NextRequest): boolean {
  return request.headers.get("Next-Action") != null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/auth")) return NextResponse.next();
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) return NextResponse.next();
  if (isServerActionRequest(request)) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const to = new URL("/onboarding", request.url);
    to.searchParams.set("from", pathname);
    return NextResponse.redirect(to);
  }
  if (isAdminPath(pathname)) {
    if (user.email && isAdminEmail(user.email)) return response;
    const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (row?.role !== "ADMIN") {
      const to = new URL("/feed", request.url);
      to.searchParams.set("message", "admin_required");
      return NextResponse.redirect(to);
    }
    return response;
  }
  if (isAppPath(pathname)) {
    const { data: profile } = await supabase.from("users").select("id, deactivated_at").eq("id", user.id).maybeSingle();
    if (!profile) {
      if (user.email && isOnboardingBypassEmail(user.email)) return response;
      const to = new URL("/onboarding", request.url);
      to.searchParams.set("from", pathname);
      return NextResponse.redirect(to);
    }
    if (profile.deactivated_at) {
      const isOwnProfile = pathname === `/profile/${user.id}` || pathname.startsWith(`/profile/${user.id}/`);
      if (!isOwnProfile) {
        const to = new URL("/", request.url);
        to.searchParams.set("message", "account_deactivated");
        return NextResponse.redirect(to);
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
