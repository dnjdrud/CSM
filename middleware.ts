/**
 * Route guards. Supabase session only.
 * Public paths from lib/auth/publicPaths (/, /principles, /contact, /onboarding, /auth/callback).
 * /admin/* requires session + role = ADMIN.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin/bootstrap";
import { PUBLIC_PATHS } from "@/lib/auth/publicPaths";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    if (isPublicPath(pathname)) return NextResponse.next();

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
      // Allow by email allowlist (RLS may block role update in middleware, so don't rely on DB here)
      if (user.email && isAdminEmail(user.email)) {
        return response;
      }
      const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (row?.role !== "ADMIN") {
        const to = new URL("/feed", request.url);
        to.searchParams.set("message", "admin_required");
        return NextResponse.redirect(to);
      }
    } else if (pathname !== "/onboarding" && pathname !== "/onboarding/complete") {
      const { data: profile } = await supabase.from("users").select("id, deactivated_at").eq("id", user.id).maybeSingle();
      if (!profile) {
        return NextResponse.redirect(new URL("/login?message=profile_missing", request.url));
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
  } catch (e) {
    console.error("middleware error", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
