/**
 * POST /api/cell/invite/[token]/accept
 * Accept a cell invite: validate token, join cell, mark used.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Look up invite
    const { data: invite } = await admin
      .from("cell_invites")
      .select("id, cell_id, used_by, expires_at")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }
    if (invite.used_by) {
      return NextResponse.json({ error: "Invite already used" }, { status: 410 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Join cell (upsert to handle duplicate gracefully)
    const { error: joinError } = await admin
      .from("cell_memberships")
      .upsert(
        { cell_id: invite.cell_id, user_id: userId, role: "MEMBER" },
        { onConflict: "cell_id,user_id", ignoreDuplicates: true }
      );

    if (joinError) {
      console.error("[cell invite accept]", joinError.message);
      return NextResponse.json({ error: "Failed to join cell" }, { status: 500 });
    }

    // Mark invite as used
    await admin
      .from("cell_invites")
      .update({ used_by: userId })
      .eq("id", invite.id);

    return NextResponse.json({ cellId: invite.cell_id });
  } catch (e) {
    console.error("[cell invite accept]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
