/**
 * Magic link callback (Route Handler).
 * Exchanges code for session and sets cookies on the redirect response.
 * Server Component page cannot set cookies on redirect → use route.ts.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/feed";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Response we'll attach session cookies to, then copy to redirect
  const responseWithCookies = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          responseWithCookies.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !user) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  const path = profile ? (next.startsWith("/") ? next : "/feed") : "/onboarding";
  const redirectResponse = NextResponse.redirect(`${origin}${path}`);

  // Copy session cookies onto the redirect response
  responseWithCookies.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, { path: "/" });
  });

  return redirectResponse;
}
