/**
 * POST /api/cell/[id]/invite
 * Generate an invite link for a private cell (creator/moderator only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cellId } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Verify the cell exists and requester is creator or moderator
    const { data: cell } = await admin
      .from("cells")
      .select("id, type, creator_id")
      .eq("id", cellId)
      .single();

    if (!cell) {
      return NextResponse.json({ error: "Cell not found" }, { status: 404 });
    }

    const isCreator = cell.creator_id === userId;
    if (!isCreator) {
      const { data: membership } = await admin
        .from("cell_memberships")
        .select("role")
        .eq("cell_id", cellId)
        .eq("user_id", userId)
        .single();
      if (!membership || membership.role !== "MODERATOR") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Create invite (DB default generates the token)
    const { data: invite, error } = await admin
      .from("cell_invites")
      .insert({ cell_id: cellId, created_by: userId })
      .select("token, expires_at")
      .single();

    if (error || !invite) {
      console.error("[cell invite]", error?.message);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return NextResponse.json({
      token: invite.token,
      expiresAt: invite.expires_at,
      url: `${baseUrl}/cell/join/${encodeURIComponent(invite.token)}`,
    });
  } catch (e) {
    console.error("[cell invite POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
