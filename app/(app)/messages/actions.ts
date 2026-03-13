"use server";

import { getSession } from "@/lib/auth/session";
import { sendDirectMessage, markConversationRead, searchPeople } from "@/lib/data/repository";
import type { DirectMessage, User } from "@/lib/domain/types";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

export async function sendMessageAction(
  recipientId: string,
  content: string
): Promise<{ ok: boolean; message?: DirectMessage; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Message is empty" };
  if (trimmed.length > 2000) return { ok: false, error: "Message too long" };
  if (recipientId === session.userId) return { ok: false, error: "Cannot message yourself" };
  try {
    await assertRateLimit({ userId: session.userId, action: "SEND_DM", maxPerMinute: 20, maxPer10Min: 60 });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed" };
  }
  try {
    const message = await sendDirectMessage(session.userId, recipientId, trimmed);
    const { notifyNewMessage } = await import("@/lib/notifications/events");
    await notifyNewMessage({ recipientId, actorId: session.userId });
    return { ok: true, message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send message" };
  }
}

export async function markConversationReadAction(partnerId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await markConversationRead(session.userId, partnerId);
}

export async function searchUsersAction(q: string): Promise<User[]> {
  const session = await getSession();
  if (!session || !q.trim()) return [];
  return searchPeople({ q: q.trim(), viewerId: session.userId });
}

export async function pollNewMessagesAction(
  partnerId: string,
  sinceIso: string
): Promise<{ id: string; senderId: string; recipientId: string; content: string; createdAt: string }[]> {
  const session = await getSession();
  if (!session) return [];
  const { supabaseServer } = await import("@/lib/supabase/server");
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at")
    .or(
      `and(sender_id.eq.${session.userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${session.userId})`
    )
    .gt("created_at", sinceIso)
    .order("created_at", { ascending: true });
  return (rows ?? []).map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    content: r.content,
    createdAt: r.created_at,
  }));
}
