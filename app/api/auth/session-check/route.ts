/**
 * GET /api/auth/session-check
 * Returns 200 if session is valid (cookies present and valid), 401 otherwise.
 * Used by client to verify session after navigation; triggers router.refresh() so RSC re-renders with session.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // read-only for this route
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, userId: user.id });
}
