"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

export type DiagnosticsResult = {
  auth: { userId: string | null; email: string | null; error?: string };
  profile: { profileId: string | null; role: string | null; error?: string };
  postsCount: number | null;
  postsCountError?: string;
  latestPosts: { id: string; created_at: string }[];
  latestPostsError?: string;
};

/**
 * Run server-side diagnostics: auth, profile, posts count, latest posts. Admin-only.
 */
export async function runDiagnostics(): Promise<DiagnosticsResult> {
  await requireAdmin();

  const result: DiagnosticsResult = {
    auth: { userId: null, email: null },
    profile: { profileId: null, role: null },
    postsCount: null,
    latestPosts: [],
  };

  const supabase = await supabaseServer();
  const { data: { session: authSession } } = await supabase.auth.getSession();
  const authUser = authSession?.user ?? null;
  if (authUser) {
    result.auth.userId = authUser.id;
    result.auth.email = authUser.email ?? null;
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

  return result;
}
