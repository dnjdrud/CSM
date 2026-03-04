/**
 * GET /api/debug/session
 * Diagnostic: same cookie/supabase context as RSC. Returns getSession(), getUser(), and cookie list
 * so we can verify server-side session is readable (HeaderWrapper / feed page).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Payload = {
  request: { host: string; pathname: string };
  cookiesFromHeaders: string[];
  getUser: { userId: string | null; email: string | null } | null;
  getSession: { userId: string; role: string } | null;
  feedWouldGetCurrentUserId: string | null;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const payload: Payload = {
    request: { host: requestUrl.host, pathname: requestUrl.pathname },
    cookiesFromHeaders: [],
    getUser: null,
    getSession: null,
    feedWouldGetCurrentUserId: null,
  };

  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();
    payload.cookiesFromHeaders = all.map((c) => c.name).filter((n) => n.startsWith("sb-"));

    const supabase = await supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return NextResponse.json({
        ...payload,
        authError: authError.message,
      });
    }
    if (authData?.user) {
      payload.getUser = {
        userId: authData.user.id,
        email: authData.user.email ?? null,
      };
    }

    const session = await getSession();
    if (session) {
      payload.getSession = { userId: session.userId, role: session.role };
      payload.feedWouldGetCurrentUserId = session.userId;
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ...payload, error: message });
  }
}
