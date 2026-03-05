/**
 * POST /api/auth/magic-link — Send magic link email via Supabase native OTP.
 * Body: { email: string }
 * Supabase handles email delivery (configured in Supabase dashboard).
 * On success, user receives email with a link pointing to /auth/callback.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getBaseUrlForLinks } from "@/lib/url/site";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const baseUrl = getBaseUrlForLinks(request);
  const emailRedirectTo = `${baseUrl}/auth/callback`;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
