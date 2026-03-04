/**
 * Magic link callback (Route Handler).
 * Exchanges code for session and sets cookies on the redirect response.
 * Cookies must be written with full options (httpOnly, secure, sameSite, maxAge) so the server can read them on the next request.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieOption = { name: string; value: string; options?: Record<string, unknown> };

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

  const cookiesToSet: CookieOption[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies: CookieOption[]) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !user) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const { ensureProfile } = await import("@/lib/auth/ensureProfile");
  await ensureProfile({ userId: user.id, email: user.email });

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  const path = profile ? (next.startsWith("/") ? next : "/feed") : "/onboarding";
  const redirectResponse = NextResponse.redirect(`${origin}${path}`);

  cookiesToSet.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, { path: "/", ...options } as Parameters<NextResponse["cookies"]["set"]>[2]);
  });

  return redirectResponse;
}
