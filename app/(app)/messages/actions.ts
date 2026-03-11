"use server";

import { getSession } from "@/lib/auth/session";
import { sendDirectMessage, markConversationRead } from "@/lib/data/repository";
import type { DirectMessage } from "@/lib/domain/types";
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
