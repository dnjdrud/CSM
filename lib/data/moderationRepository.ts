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

export async function listRecentReports(limit = 200): Promise<ModerationReport[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("moderation_reports")
    .select("id, type, reporter_id, target_user_id, post_id, comment_id, reason, status, created_at, resolved_at, resolved_by")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (rows ?? []).map(rowToReport);
}

export async function resolveReport(reportId: string, adminId: string): Promise<void> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  await supabase
    .from("moderation_reports")
    .update({ status: "RESOLVED", resolved_at: now, resolved_by: adminId })
    .eq("id", reportId);
}

export async function hidePost(postId: string, adminId: string): Promise<void> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  await supabase
    .from("posts")
    .update({ hidden_at: now, hidden_by: adminId })
    .eq("id", postId);
}

export async function unhidePost(postId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase
    .from("posts")
    .update({ hidden_at: null, hidden_by: null })
    .eq("id", postId);
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("comments").delete().eq("id", commentId);
}
