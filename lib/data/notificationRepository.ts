import type { Notification, NotificationType, NotificationPrefs } from "@/lib/domain/types";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";

export async function listNotifications(recipientId: string): Promise<Notification[]> {
  const supabase = await supabaseServer();
  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, type, recipient_id, actor_id, post_id, read_at, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (rows ?? []).map((r) => ({
    id: r.id,
    type: r.type as NotificationType,
    recipientId: r.recipient_id,
    actorId: r.actor_id,
    postId: r.post_id ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    readAt: r.read_at ?? undefined,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", recipientId)
    .is("read_at", null);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await supabaseServer();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

function parseNotifPrefs(raw: unknown): NotificationPrefs {
  const defaults = DEFAULT_NOTIFICATION_PREFS;
  if (!raw || typeof raw !== "object") return { ...defaults };
  const r = raw as Record<string, unknown>;
  return {
    pushComments:        typeof r.pushComments        === "boolean" ? r.pushComments        : defaults.pushComments,
    pushReactions:       typeof r.pushReactions       === "boolean" ? r.pushReactions       : defaults.pushReactions,
    pushFollowers:       typeof r.pushFollowers       === "boolean" ? r.pushFollowers       : defaults.pushFollowers,
    pushCellMessages:    typeof r.pushCellMessages    === "boolean" ? r.pushCellMessages    : defaults.pushCellMessages,
    pushPrayerResponses: typeof r.pushPrayerResponses === "boolean" ? r.pushPrayerResponses : defaults.pushPrayerResponses,
    emailWeeklyDigest:   typeof r.emailWeeklyDigest   === "boolean" ? r.emailWeeklyDigest   : defaults.emailWeeklyDigest,
    emailCellInvites:    typeof r.emailCellInvites    === "boolean" ? r.emailCellInvites    : defaults.emailCellInvites,
  };
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("users")
    .select("notification_prefs")
    .eq("id", userId)
    .single();
  return parseNotifPrefs(data?.notification_prefs);
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const current = await getNotificationPrefs(userId);
  const merged = { ...current, ...prefs };
  const { error } = await supabase
    .from("users")
    .update({ notification_prefs: merged })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
