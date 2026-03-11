/**
 * Admin-only data access. All mutating functions perform the action and log to audit_logs.
 * Uses supabaseServer(); requires audit_logs (and blocks/mutes) migration.
 */
import type { User, UserRole, AuditLogEntry } from "@/lib/domain/types";
import { ADMIN_ACTION, AUDIT_TARGET_TYPE } from "@/lib/admin/constants";
import { logAdminAction } from "@/lib/admin/audit";
import { supabaseServer } from "@/lib/supabase/server";

function rowToUser(r: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null }): User {
  return {
    id: r.id,
    name: r.name ?? "",
    role: (r.role as UserRole) ?? "LAY",
    bio: r.bio ?? undefined,
    affiliation: r.affiliation ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function rowToAuditEntry(r: { id: string; actor_id: string; action: string; target_type: string; target_id: string | null; metadata: unknown; created_at: string | null }): AuditLogEntry {
  return {
    id: r.id,
    actorId: r.actor_id,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export interface DashboardStats {
  openReportsToday: number;
  newUsersToday: number;
  activeUsersLast7d: number;
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  newPostsToday: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await supabaseServer();
  const today = new Date().toISOString().slice(0, 10);
  const todayEnd = `${today}T23:59:59.999Z`;

  const [
    { count: openReportsToday },
    { count: newUsersToday },
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: newPostsToday },
  ] = await Promise.all([
    supabase.from("moderation_reports").select("id", { count: "exact", head: true }).eq("status", "OPEN").gte("created_at", today).lt("created_at", todayEnd),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", today).lt("created_at", todayEnd),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", today).lt("created_at", todayEnd),
  ]);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: postAuthors } = await supabase.from("posts").select("author_id").gte("created_at", since);
  const { data: commentAuthors } = await supabase.from("comments").select("author_id").gte("created_at", since);
  const { data: reactionUsers } = await supabase.from("reactions").select("user_id").gte("created_at", since);
  const activeIds = new Set<string>();
  (postAuthors ?? []).forEach((r) => activeIds.add(r.author_id));
  (commentAuthors ?? []).forEach((r) => activeIds.add(r.author_id));
  (reactionUsers ?? []).forEach((r) => activeIds.add(r.user_id));

  return {
    openReportsToday: openReportsToday ?? 0,
    newUsersToday: newUsersToday ?? 0,
    activeUsersLast7d: activeIds.size,
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    totalComments: totalComments ?? 0,
    newPostsToday: newPostsToday ?? 0,
  };
}

export interface AdminUserRow extends User {
  blockedByAdmin: boolean;
  mutedByAdmin: boolean;
}

export async function listUsers(params: { query?: string; adminId: string }): Promise<AdminUserRow[]> {
  const supabase = await supabaseServer();
  let q = supabase.from("users").select("id, name, role, bio, affiliation, created_at").order("created_at", { ascending: false });
  if (params.query?.trim()) {
    const term = params.query.trim();
    q = q.ilike("name", `%${term}%`);
  }
  const { data: rows } = await q.limit(200);
  if (!rows?.length) return [];

  const userIds = rows.map((r) => r.id);
  const { data: blocks } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", params.adminId).in("blocked_id", userIds);
  const { data: mutes } = await supabase.from("mutes").select("muted_id").eq("muter_id", params.adminId).in("muted_id", userIds);
  const blockedSet = new Set((blocks ?? []).map((r) => r.blocked_id));
  const mutedSet = new Set((mutes ?? []).map((r) => r.muted_id));

  return rows.map((r) => ({
    ...rowToUser(r),
    blockedByAdmin: blockedSet.has(r.id),
    mutedByAdmin: mutedSet.has(r.id),
  }));
}

export async function blockUser(adminId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("blocks").upsert(
    { blocker_id: adminId, blocked_id: userId, created_at: new Date().toISOString() },
    { onConflict: "blocker_id,blocked_id" }
  );
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.BLOCK_USER,
    targetType: AUDIT_TARGET_TYPE.USER,
    targetId: userId,
    metadata: {},
  });
}

export async function unblockUser(adminId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("blocks").delete().eq("blocker_id", adminId).eq("blocked_id", userId);
}

export async function muteUser(adminId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("mutes").upsert(
    { muter_id: adminId, muted_id: userId, created_at: new Date().toISOString() },
    { onConflict: "muter_id,muted_id" }
  );
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.MUTE_USER,
    targetType: AUDIT_TARGET_TYPE.USER,
    targetId: userId,
    metadata: {},
  });
}

export async function unmuteUser(adminId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("mutes").delete().eq("muter_id", adminId).eq("muted_id", userId);
}

export async function changeUserRole(adminId: string, userId: string, role: UserRole): Promise<void> {
  const supabase = await supabaseServer();
  const { data: prev } = await supabase.from("users").select("role").eq("id", userId).single();
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  const updateClient = admin ?? supabase;
  const { error } = await updateClient.from("users").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.CHANGE_ROLE,
    targetType: AUDIT_TARGET_TYPE.USER,
    targetId: userId,
    metadata: { previousRole: prev?.role ?? null, newRole: role },
  });
}

export async function listAuditLogs(params: { limit?: number }): Promise<AuditLogEntry[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 100;
  const { data: rows } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (rows ?? []).map(rowToAuditEntry);
}

export async function hidePost(adminId: string, postId: string): Promise<void> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  await supabase.from("posts").update({ hidden_at: now, hidden_by: adminId }).eq("id", postId);
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.HIDE_POST,
    targetType: AUDIT_TARGET_TYPE.POST,
    targetId: postId,
    metadata: {},
  });
}

export async function deleteComment(adminId: string, commentId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("comments").delete().eq("id", commentId);
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.DELETE_COMMENT,
    targetType: AUDIT_TARGET_TYPE.COMMENT,
    targetId: commentId,
    metadata: {},
  });
}

export async function resolveModerationReport(adminId: string, reportId: string): Promise<void> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  await supabase
    .from("moderation_reports")
    .update({ status: "RESOLVED", resolved_at: now, resolved_by: adminId })
    .eq("id", reportId);
  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.RESOLVE_REPORT,
    targetType: AUDIT_TARGET_TYPE.REPORT,
    targetId: reportId,
    metadata: {},
  });
}

/** Today's date YYYY-MM-DD in Asia/Seoul (for idempotency). */
function getTodayAsiaSeoul(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`;
}

/** Create today's Daily Prayer post and log audit. Idempotent: if a post with same title by this admin exists today, return reused. */
export async function createDailyPrayer(adminId: string, customContent?: string): Promise<{ postId: string; reused: boolean }> {
  const { buildDailyPrayerPost } = await import("@/lib/domain/dailyPrayer");
  const supabase = await supabaseServer();
  const today = getTodayAsiaSeoul();
  const payload = buildDailyPrayerPost({ date: new Date() });
  if (customContent?.trim()) payload.content = customContent.trim();

  const startOfToday = new Date(today + "T00:00:00.000Z").toISOString();
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", adminId)
    .eq("category", "PRAYER")
    .contains("tags", ["daily-prayer"])
    .gte("created_at", startOfToday)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await logAdminAction({
      actorId: adminId,
      action: ADMIN_ACTION.CREATE_DAILY_PRAYER,
      targetType: AUDIT_TARGET_TYPE.POST,
      targetId: existing.id,
      metadata: { date: today, title: "Daily Prayer (reused)", reused: true },
    });
    return { postId: existing.id, reused: true };
  }

  const { data: row, error: insertError } = await supabase
    .from("posts")
    .insert({
      author_id: adminId,
      category: payload.category,
      content: payload.content,
      visibility: payload.visibility,
      tags: payload.tags,
    })
    .select("id")
    .single();

  if (insertError || !row) throw new Error(insertError?.message ?? "Failed to create post");

  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.CREATE_DAILY_PRAYER,
    targetType: AUDIT_TARGET_TYPE.POST,
    targetId: row.id,
    metadata: { date: today, title: payload.title, reused: false },
  });

  return { postId: row.id, reused: false };
}
