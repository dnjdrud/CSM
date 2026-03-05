/**
 * POST /api/auth/set-session
 * Body: { access_token: string; refresh_token: string }
 * Accepts tokens obtained by the browser (e.g. from verifyOtp) and sets them as
 * server-side HttpOnly session cookies via createServerClient + setAll.
 * Explicit Secure + SameSite=Lax so cookies persist on HTTPS (e.g. cellah.co.kr).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isHttps(request: NextRequest): boolean {
  try {
    const u = new URL(request.url);
    if (u.protocol === "https:") return true;
    const proto = request.headers.get("x-forwarded-proto");
    return proto === "https";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { access_token, refresh_token } = body;
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
  const secure = isHttps(request);
  const defaultCookieOptions = {
    path: "/" as const,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const { domain: _d, ...rest } = (options ?? {}) as Record<string, unknown>;
          response.cookies.set(name, value, { ...defaultCookieOptions, ...rest });
        });
      },
    },
  });

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return response;
}
