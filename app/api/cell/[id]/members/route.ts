/**
 * GET  /api/cell/[id]/members/candidates – following users not yet in cell
 * POST /api/cell/[id]/members            – invite a user directly (creator/member)
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { listFollowingWithNames } from "@/lib/data/repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cellId } = await params;
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get users I follow
  const following = await listFollowingWithNames(userId);

  // Get existing cell members so we can mark them
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: members } = await admin
    .from("cell_memberships")
    .select("user_id")
    .eq("cell_id", cellId);

  const memberSet = new Set((members ?? []).map((m: { user_id: string }) => m.user_id));

  const candidates = following.map((u) => ({ ...u, alreadyMember: memberSet.has(u.id) }));

  return NextResponse.json(candidates);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cellId } = await params;
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // Requester must be a member (or creator) of the cell
  const { data: cell } = await admin
    .from("cells")
    .select("creator_id")
    .eq("id", cellId)
    .single();

  if (!cell) return NextResponse.json({ error: "Cell not found" }, { status: 404 });

  const isCreator = cell.creator_id === userId;
  if (!isCreator) {
    const { data: myMembership } = await admin
      .from("cell_memberships")
      .select("user_id")
      .eq("cell_id", cellId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!myMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Add the target user using admin client (bypasses RLS which only allows self-insert)
  const { error } = await admin
    .from("cell_memberships")
    .upsert(
      { cell_id: cellId, user_id: targetUserId, role: "MEMBER" },
      { onConflict: "cell_id,user_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[cell members POST]", error.message);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
