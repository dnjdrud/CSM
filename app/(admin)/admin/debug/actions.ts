"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type DiagnosticsResult = {
  auth: { userId: string | null; email: string | null; error?: string };
  profile: { profileId: string | null; role: string | null; error?: string };
  postsCount: number | null;
  postsCountError?: string;
  latestPosts: { id: string; created_at: string }[];
  latestPostsError?: string;
  inviteTest: { ok: boolean; error?: string };
};

/**
 * Run server-side diagnostics: auth, profile, posts count, latest posts, invite insert test.
 * Admin-only. Used on /admin/debug to reveal RLS/auth issues.
 */
export async function runDiagnostics(): Promise<DiagnosticsResult> {
  await requireAdmin();

  const result: DiagnosticsResult = {
    auth: { userId: null, email: null },
    profile: { profileId: null, role: null },
    postsCount: null,
    latestPosts: [],
    inviteTest: { ok: false },
  };

  const supabase = await supabaseServer();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    result.auth.error = authError.message;
  } else if (authData?.user) {
    result.auth.userId = authData.user.id;
    result.auth.email = authData.user.email ?? null;
  }

  if (result.auth.userId) {
    const { data: profileRow, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", result.auth.userId)
      .single();
    if (profileError) {
      result.profile.error = profileError.message;
    } else if (profileRow) {
      result.profile.profileId = profileRow.id;
      result.profile.role = profileRow.role;
    }
  }

  const { count: postsCount, error: postsCountError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true });
  if (postsCountError) {
    result.postsCountError = postsCountError.message;
  } else {
    result.postsCount = postsCount ?? 0;
  }

  const { data: postsRows, error: postsError } = await supabase
    .from("posts")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (postsError) {
    result.latestPostsError = postsError.message;
  } else if (postsRows?.length) {
    result.latestPosts = postsRows.map((r) => ({ id: r.id, created_at: r.created_at ?? "" }));
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const testCode = "TEST-" + Math.random().toString(36).slice(2, 12);
    const insertResult = await admin
      .from("invite_codes")
      .insert({ code: testCode, created_by: result.auth.userId ?? undefined })
      .select("id")
      .single();
    if (insertResult.error) {
      result.inviteTest = { ok: false, error: insertResult.error.message };
    } else if (insertResult.data?.id) {
      await admin.from("invite_codes").delete().eq("id", insertResult.data.id);
      result.inviteTest = { ok: true };
    }
  } else {
    result.inviteTest = { ok: false, error: "Admin client not available (missing SUPABASE_SERVICE_ROLE_KEY)" };
  }

  return result;
}
