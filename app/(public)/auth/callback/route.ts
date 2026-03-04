/**
 * Auth callback (Route Handler).
 * Supports both PKCE code flow and token_hash OTP flow.
 * Writes Supabase auth cookies so Server Components can read sessions.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Support multiple callback formats
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type"); // e.g. "magiclink"
  const next = requestUrl.searchParams.get("next") ?? "/feed";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/onboarding?error=missing_env`);
  }

  // Use Next.js cookie store (writeable)
  const cookieStore = await cookies();

  // We'll set cookies on the response
  const response = NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/feed"}`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { path: "/", ...options });
        });
      },
    },
  });

  try {
    // Case A) PKCE code flow
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) throw error ?? new Error("No user after exchangeCodeForSession");

      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      await ensureProfile({ userId: data.user.id, email: data.user.email });
    }

    // Case B) token_hash OTP flow (magiclink)
    if (!code && token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (error || !data.user) throw error ?? new Error("No user after verifyOtp");

      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      await ensureProfile({ userId: data.user.id, email: data.user.email });
    }

    // If neither present, we can't create a session
    if (!code && !(token_hash && type)) {
      return NextResponse.redirect(`${origin}/onboarding?error=missing_code`);
    }
  } catch (e) {
    console.error("AUTH CALLBACK FAILED:", e);
    return NextResponse.redirect(`${origin}/onboarding?error=auth_callback_failed`);
  }

  return response;
}