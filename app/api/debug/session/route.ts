import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { DATA_MODE } from "@/lib/data/repositoryMode";

/** Always returns JSON. Never redirects. For diagnosing auth/session. */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const cookieList = request.cookies.getAll();
  const cookieNames = cookieList.map((c) => c.name);
  const hasSupabaseAuthCookie = cookieNames.some((n) => n.startsWith("sb-"));

  let authUser: { id: string; email: string | null } | null = null;
  let profile: { id: string; role: string } | null = null;
  let error: string | null = null;

  try {
    const supabase = await supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      error = authError.message;
    } else if (authData?.user) {
      authUser = { id: authData.user.id, email: authData.user.email ?? null };
      const { data: profileRow } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authData.user.id)
        .single();
      if (profileRow) profile = { id: profileRow.id, role: profileRow.role };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    host: requestUrl.host,
    pathname: requestUrl.pathname,
    hasSupabaseAuthCookie,
    cookieNames,
    authUser,
    profile,
    dataMode: DATA_MODE,
    error,
  });
}
