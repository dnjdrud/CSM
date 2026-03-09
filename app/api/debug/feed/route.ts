import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const POSTS_SELECT_MINIMAL = "id, author_id, category, content, visibility, tags, created_at";

/** Always returns JSON. Never redirects. Reports feed query and users read for RLS/visibility debugging. */
export async function GET() {
  let authUserId: string | null = null;
  let profileRole: string | null = null;
  let postsRawCount = 0;
  let postsAfterJoinCount = 0;
  let usersReadable = false;
  let lastError: string | null = null;

  try {
    const supabase = await supabaseServer();
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const authUser = authSession?.user ?? null;
    if (authUser) {
      authUserId = authUser.id;
      const { data: profileRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();
      profileRole = profileRow?.role ?? null;
    }

    const { data: postsRows, error: postsError } = await supabase
      .from("posts")
      .select(POSTS_SELECT_MINIMAL)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      lastError = postsError.message;
    } else {
      postsRawCount = postsRows?.length ?? 0;
      const authorIds = [...new Set((postsRows ?? []).map((r: { author_id: string }) => r.author_id))];
      if (authorIds.length > 0) {
        const { data: usersRows, error: usersError } = await supabase
          .from("users")
          .select("id")
          .in("id", authorIds);
        usersReadable = !usersError;
        if (!usersError && usersRows) {
          const foundIds = new Set(usersRows.map((r: { id: string }) => r.id));
          postsAfterJoinCount = (postsRows ?? []).filter((r: { author_id: string }) => foundIds.has(r.author_id)).length;
        } else {
          postsAfterJoinCount = 0;
          if (usersError) lastError = usersError.message;
        }
      } else {
        postsAfterJoinCount = postsRawCount;
      }
    }
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    authUserId,
    profileRole,
    postsRawCount,
    postsAfterJoinCount,
    usersReadable,
    lastError,
  });
}
