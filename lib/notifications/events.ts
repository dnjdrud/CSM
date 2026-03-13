/**
 * Notification events: insert directly into notifications table via admin client.
 * Bypasses RLS (Edge Function was removed; direct insert with service role is equivalent).
 * On failure: log and continue; do not fail the main action.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

type NotifyType =
  | "FOLLOWED_YOU"
  | "COMMENTED_ON_YOUR_POST"
  | "REACTED_TO_YOUR_POST"
  | "REPLIED_TO_YOUR_COMMENT"
  | "REACTED_TO_YOUR_COMMENT"
  | "MENTIONED_IN_COMMENT"
  | "NEW_MESSAGE";

type NotifyPayload = {
  type: NotifyType;
  recipientId: string;
  actorId: string;
  postId?: string;
};

async function insertNotification(payload: NotifyPayload): Promise<void> {
  try {
    if (payload.recipientId === payload.actorId) return;

    const dedupWindowMs = payload.type === "NEW_MESSAGE" ? 60 * 1000 : DEDUP_WINDOW_MS;
    const windowStart = new Date(Date.now() - dedupWindowMs).toISOString();
    const postIdVal = payload.postId ?? null;

    const { data: duplicates } = await supabaseAdmin
      .from("notifications")
      .select("id, post_id")
      .eq("type", payload.type)
      .eq("recipient_id", payload.recipientId)
      .eq("actor_id", payload.actorId)
      .gte("created_at", windowStart);

    const isDuplicate = (duplicates ?? []).some(
      (row: { post_id: string | null }) =>
        (row.post_id == null && postIdVal == null) || row.post_id === postIdVal
    );
    if (isDuplicate) return;

    const { error } = await supabaseAdmin.from("notifications").insert({
      type: payload.type,
      recipient_id: payload.recipientId,
      actor_id: payload.actorId,
      post_id: postIdVal,
    });

    if (error) {
      console.warn("[notify] Insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[notify] Notification error:", e);
  }
}

export async function notifyFollowed(params: { recipientId: string; actorId: string }): Promise<void> {
  await insertNotification({ type: "FOLLOWED_YOU", recipientId: params.recipientId, actorId: params.actorId });
}

export async function notifyCommented(params: { recipientId: string; actorId: string; postId: string }): Promise<void> {
  await insertNotification({ type: "COMMENTED_ON_YOUR_POST", recipientId: params.recipientId, actorId: params.actorId, postId: params.postId });
}

export async function notifyReacted(params: { recipientId: string; actorId: string; postId: string }): Promise<void> {
  await insertNotification({ type: "REACTED_TO_YOUR_POST", recipientId: params.recipientId, actorId: params.actorId, postId: params.postId });
}

export async function notifyReplied(params: { recipientId: string; actorId: string; postId: string }): Promise<void> {
  await insertNotification({ type: "REPLIED_TO_YOUR_COMMENT", recipientId: params.recipientId, actorId: params.actorId, postId: params.postId });
}

export async function notifyCommentReacted(params: { recipientId: string; actorId: string; postId: string }): Promise<void> {
  await insertNotification({ type: "REACTED_TO_YOUR_COMMENT", recipientId: params.recipientId, actorId: params.actorId, postId: params.postId });
}

export async function notifyMentioned(params: { recipientId: string; actorId: string; postId: string }): Promise<void> {
  await insertNotification({ type: "MENTIONED_IN_COMMENT", recipientId: params.recipientId, actorId: params.actorId, postId: params.postId });
}

export async function notifyNewMessage(params: { recipientId: string; actorId: string }): Promise<void> {
  await insertNotification({ type: "NEW_MESSAGE", recipientId: params.recipientId, actorId: params.actorId });
}
