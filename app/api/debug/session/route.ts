/**
 * GET /api/debug/session
 * Diagnostic: same cookie/supabase context as RSC. Returns auth.getUser(),
 * public.users row for auth user, getSession(), and cookie list.
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
  usersRow: { id: string; role: string; name: string } | null;
  usersRowError: string | null;
  getSession: { userId: string; role: string } | null;
  feedWouldGetCurrentUserId: string | null;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const payload: Payload = {
    request: { host: requestUrl.host, pathname: requestUrl.pathname },
    cookiesFromHeaders: [],
    getUser: null,
    usersRow: null,
    usersRowError: null,
    getSession: null,
    feedWouldGetCurrentUserId: null,
  };

  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();
    payload.cookiesFromHeaders = all.map((c) => c.name).filter((n) => n.startsWith("sb-"));

    const supabase = await supabaseServer();
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const authUser = authSession?.user ?? null;
    if (authUser) {
      payload.getUser = {
        userId: authUser.id,
        email: authUser.email ?? null,
      };

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, role, name")
        .eq("id", authUser.id)
        .single();
      if (userError) {
        payload.usersRowError = userError.message;
      } else if (userRow) {
        payload.usersRow = {
          id: userRow.id,
          role: (userRow.role as string) ?? "",
          name: (userRow.name as string) ?? "",
        };
      }
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
