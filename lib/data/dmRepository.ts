import type { DirectMessage, ConversationPreview } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthorMap } from "./_internal/postHelpers";

export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  content: string
): Promise<DirectMessage> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, content: content.trim() })
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to send message");
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);
  if (!rows?.length) return [];

  const seenPartners = new Set<string>();
  const latestByPartner = new Map<string, typeof rows[0]>();
  const unreadByPartner = new Map<string, number>();

  for (const row of rows) {
    const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    if (!latestByPartner.has(partnerId)) {
      latestByPartner.set(partnerId, row);
    }
    if (!seenPartners.has(partnerId)) {
      seenPartners.add(partnerId);
      unreadByPartner.set(partnerId, 0);
    }
    if (row.recipient_id === userId && !row.read_at) {
      unreadByPartner.set(partnerId, (unreadByPartner.get(partnerId) ?? 0) + 1);
    }
  }

  const partnerIds = [...seenPartners];
  const authorMap = await getAuthorMap(supabase, partnerIds);

  return partnerIds
    .map((partnerId) => {
      const latest = latestByPartner.get(partnerId)!;
      const partner = authorMap.get(partnerId);
      if (!partner) return null;
      return {
        partner,
        latestMessage: {
          content: latest.content,
          createdAt: latest.created_at,
          senderId: latest.sender_id,
        },
        unreadCount: unreadByPartner.get(partnerId) ?? 0,
      } satisfies ConversationPreview;
    })
    .filter((c): c is ConversationPreview => c !== null);
}

export async function listMessages(
  userId: string,
  partnerId: string,
  limit = 100
): Promise<(DirectMessage & { sender: import("@/lib/domain/types").User })[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);
  if (!rows?.length) return [];
  const authorMap = await getAuthorMap(supabase, [userId, partnerId]);
  return rows.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    content: r.content,
    createdAt: r.created_at,
    readAt: r.read_at ?? undefined,
    sender: authorMap.get(r.sender_id) ?? {
      id: r.sender_id,
      name: "Unknown",
      role: "LAY" as const,
      createdAt: r.created_at,
    },
  }));
}

export async function markConversationRead(userId: string, partnerId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("sender_id", partnerId)
    .is("read_at", null);
}
