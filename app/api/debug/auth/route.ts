import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JsonResponse = {
  serverUrl: string | undefined;
  hasAnonKey: boolean;
  authUser: { id: string; email: string | null } | null;
  profile: { id: string; role: string } | null;
  authUidSql: string | null;
  postsSummary: {
    total_posts: number;
    visible_posts: number;
    pinned_posts: number;
    newest_created_at: string | null;
  } | null;
  inviteInsertTest: { ok: boolean; error?: string };
};

export async function GET() {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const payload: JsonResponse = {
      serverUrl,
      hasAnonKey,
      authUser: null,
      profile: null,
      authUidSql: null,
      postsSummary: null,
      inviteInsertTest: { ok: false },
    };

    const supabase = await supabaseServer();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ ...payload, authError: authError.message }, { status: 200 });
    }
    if (authData?.user) {
      payload.authUser = { id: authData.user.id, email: authData.user.email ?? null };
      const { data: profileRow, error: profileError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authData.user.id)
        .single();
      if (!profileError && profileRow) {
        payload.profile = { id: profileRow.id, role: profileRow.role };
      }
    }

    try {
      const { data: rpcData } = await supabase.rpc("auth_uid" as "uid");
      if (rpcData != null) payload.authUidSql = String(rpcData);
    } catch {
      // No RPC or not available
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
      pinned_posts: 0,
      newest_created_at: newestRow?.created_at ?? null,
    };

    if (payload.profile?.role === "ADMIN" && payload.authUser?.id) {
      const testCode = "DEBUG-" + Math.random().toString(36).slice(2, 12);
      const insertRes = await supabase
        .from("invite_codes")
        .insert({ code: testCode, created_by: payload.authUser.id })
        .select("id")
        .single();
      if (insertRes.error) {
        payload.inviteInsertTest = { ok: false, error: insertRes.error.message };
      } else if (insertRes.data?.id) {
        await supabase.from("invite_codes").delete().eq("id", insertRes.data.id);
        payload.inviteInsertTest = { ok: true };
      }
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        serverUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        authUser: null,
        profile: null,
        authUidSql: null,
        postsSummary: null,
        inviteInsertTest: { ok: false, error: message },
      },
      { status: 200 }
    );
  }
}
