import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JsonResponse = {
  request: {
    host: string;
    pathname: string;
    searchKeys: string[];
  };
  cookies: {
    hasSupabaseAuth: boolean;
    sbCookieNames: string[];
  };
  serverUrl: string | undefined;
  hasAnonKey: boolean;
  authUser: { id: string; email: string | null } | null;
  authError?: string;
  profile: { id: string; role: string } | null;
  authUidSql: string | null;
  postsSummary: {
    total_posts: number;
    visible_posts: number;
    newest_created_at: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const searchKeys: string[] = [];
    requestUrl.searchParams.forEach((_, key) => searchKeys.push(key));

    const cookieList = request.cookies.getAll();
    const sbCookieNames = cookieList
      .filter((c) => c.name.startsWith("sb-"))
      .map((c) => c.name);
    const hasSupabaseAuth = sbCookieNames.length > 0;

    const payload: JsonResponse = {
      request: {
        host: requestUrl.host,
        pathname: requestUrl.pathname,
        searchKeys,
      },
      cookies: {
        hasSupabaseAuth,
        sbCookieNames,
      },
      serverUrl,
      hasAnonKey,
      authUser: null,
      profile: null,
      authUidSql: null,
      postsSummary: null,
    };

    const supabase = await supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getSession().then(r => ({ data: { user: r.data.session?.user ?? null }, error: null }));

    if (authError) {
      payload.authError = authError.message;
      return NextResponse.json(payload, { status: 200 });
    }
    if (authData?.user) {
      payload.authUser = { id: authData.user.id, email: authData.user.email ?? null };
      const { data: profileRow } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authData.user.id)
        .single();
      if (profileRow) {
        payload.profile = { id: profileRow.id, role: profileRow.role };
      }
    }

    try {
      const { data: rpcData } = await supabase.rpc("auth_uid" as "uid");
      if (rpcData != null) payload.authUidSql = String(rpcData);
    } catch {
      // ignore
    }

    const { count: totalCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true });
    const { data: newestRow } = await supabase
      .from("posts")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    payload.postsSummary = {
      total_posts: totalCount ?? 0,
      visible_posts: totalCount ?? 0,
      newest_created_at: newestRow?.created_at ?? null,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        request: { host: "", pathname: "", searchKeys: [] },
        cookies: { hasSupabaseAuth: false, sbCookieNames: [] },
        serverUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        authUser: null,
        authError: message,
        profile: null,
        authUidSql: null,
        postsSummary: null,
      },
      { status: 200 }
    );
  }
}
