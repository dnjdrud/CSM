/**
 * Route guards. Skips /api, /_next, /auth, static. Public paths allowed. App = session+profile, Admin = ADMIN.
 * Uses the official Supabase SSR setAll pattern: updates request.cookies AND reassigns response,
 * so token refreshes are correctly propagated to the browser on every navigation.
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

  // Official Supabase SSR pattern: supabaseResponse is reassigned in setAll so
  // token refreshes are reflected in both the request (for same-run reads) and the
  // response (Set-Cookie headers sent to the browser).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Step 1: update request so subsequent same-request reads see fresh tokens.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Step 2: create a new response that embeds the updated request.
        supabaseResponse = NextResponse.next({ request });
        // Step 3: set cookies on the new response (sent as Set-Cookie to browser).
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  // IMPORTANT: No logic between createServerClient and getUser().
  const { data: { user } } = await supabase.auth.getUser();

  /** Copy session cookies from supabaseResponse to a redirect, so token refreshes reach the browser. */
  function withSessionCookies(redirect: NextResponse): NextResponse {
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
      redirect.cookies.set(name, value, opts);
    });
    return redirect;
  }

  if (isOnboardingOrRequestAccessPath(pathname)) {
    if (!user) return supabaseResponse;
    const { data: roleRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (roleRow?.role === "ADMIN") return supabaseResponse;
    return withSessionCookies(NextResponse.redirect(new URL("/feed", request.url)));
  }

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?from=" + encodeURIComponent(pathname), request.url)
    );
  }

  if (isAdminPath(pathname)) {
    if (user.email && isAdminEmail(user.email)) return supabaseResponse;
    const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (row?.role !== "ADMIN") {
      return withSessionCookies(NextResponse.redirect(new URL("/feed?message=admin_required", request.url)));
    }
    return supabaseResponse;
  }

  if (isAppPath(pathname)) {
    const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      return withSessionCookies(
        NextResponse.redirect(new URL("/api/auth/ensure-profile?next=" + encodeURIComponent(pathname), request.url))
      );
    }
    try {
      const { data: deact } = await supabase.from("users").select("deactivated_at").eq("id", user.id).maybeSingle();
      if (deact?.deactivated_at) {
        const isOwnProfile = pathname === `/profile/${user.id}` || pathname.startsWith(`/profile/${user.id}/`);
        if (!isOwnProfile) {
          return withSessionCookies(NextResponse.redirect(new URL("/?message=account_deactivated", request.url)));
        }
      }
    } catch {
      // deactivated_at column may not exist yet; allow access
    }
  }
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
