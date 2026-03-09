/**
 * GET /api/debug/middleware-check
 * Tests EXACTLY what middleware does: reads cookies from request.cookies (not next/headers),
 * creates createServerClient with request.cookies.getAll(), calls auth.getSession().
 * Compare this result with /api/debug/session to find discrepancies.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter((c) => c.name.startsWith("sb-"));

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase env vars", sbCookies: sbCookies.map(c => c.name) });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // no-op: read-only check
      },
    },
  });

  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({
    description: "Same cookie/session logic as middleware (request.cookies.getAll + createServerClient)",
    sbCookieCount: sbCookies.length,
    sbCookieNames: sbCookies.map((c) => c.name),
    sessionUserId: session?.user?.id ?? null,
    sessionEmail: session?.user?.email ?? null,
    sessionError: error?.message ?? null,
    totalCookieCount: allCookies.length,
  });
}
