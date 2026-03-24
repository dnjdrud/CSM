/**
 * Moderation data access. Admin-only operations; uses supabaseServer() with admin session.
 */
import type { ModerationReport } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";

function rowToReport(r: {
  id: string;
  type: string;
  reporter_id: string;
  target_user_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  reason: string | null;
  status: string;
  created_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}): ModerationReport {
  return {
    id: r.id,
    type: r.type as ModerationReport["type"],
    reporterId: r.reporter_id,
    targetUserId: r.target_user_id ?? undefined,
    postId: r.post_id ?? undefined,
    commentId: r.comment_id ?? undefined,
    reason: r.reason ?? undefined,
    status: r.status as ModerationReport["status"],
    createdAt: r.created_at ?? new Date().toISOString(),
    resolvedAt: r.resolved_at ?? undefined,
    resolvedBy: r.resolved_by ?? undefined,
  };
}

export async function listOpenReports(): Promise<ModerationReport[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("moderation_reports")
    .select("id, type, reporter_id, target_user_id, post_id, comment_id, reason, status, created_at, resolved_at, resolved_by")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });
  return (rows ?? []).map(rowToReport);
}

