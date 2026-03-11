/**
 * Notification events: invoke notify Edge Function. Server-only (used from repository).
 * On failure: log and continue; do not fail the main action.
 */
import { supabaseServer } from "@/lib/supabase/server";

type NotifyPayload = {
  type: "FOLLOWED_YOU" | "COMMENTED_ON_YOUR_POST" | "REACTED_TO_YOUR_POST" | "REPLIED_TO_YOUR_COMMENT" | "REACTED_TO_YOUR_COMMENT" | "MENTIONED_IN_COMMENT" | "NEW_MESSAGE";
  recipientId: string;
  actorId: string;
  postId?: string;
};

async function invokeNotify(payload: NotifyPayload): Promise<void> {
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.functions.invoke("notify", { body: payload });
    if (error) {
      console.warn("[notify] Edge function error:", error.message);
    }
  } catch (e) {
    console.warn("[notify] Invoke failed:", e);
  }
}

export async function notifyFollowed(params: { recipientId: string; actorId: string }): Promise<void> {
  await invokeNotify({
    type: "FOLLOWED_YOU",
    recipientId: params.recipientId,
    actorId: params.actorId,
  });
}

export async function notifyCommented(params: {
  recipientId: string;
  actorId: string;
  postId: string;
}): Promise<void> {
  await invokeNotify({
    type: "COMMENTED_ON_YOUR_POST",
    recipientId: params.recipientId,
    actorId: params.actorId,
    postId: params.postId,
  });
}

export async function notifyReacted(params: {
  recipientId: string;
  actorId: string;
  postId: string;
}): Promise<void> {
  await invokeNotify({
    type: "REACTED_TO_YOUR_POST",
    recipientId: params.recipientId,
    actorId: params.actorId,
    postId: params.postId,
  });
}

export async function notifyReplied(params: {
  recipientId: string;
  actorId: string;
  postId: string;
}): Promise<void> {
  await invokeNotify({
    type: "REPLIED_TO_YOUR_COMMENT",
    recipientId: params.recipientId,
    actorId: params.actorId,
    postId: params.postId,
  });
}

export async function notifyCommentReacted(params: {
  recipientId: string;
  actorId: string;
  postId: string;
}): Promise<void> {
  await invokeNotify({
    type: "REACTED_TO_YOUR_COMMENT",
    recipientId: params.recipientId,
    actorId: params.actorId,
    postId: params.postId,
  });
}

export async function notifyMentioned(params: {
  recipientId: string;
  actorId: string;
  postId: string;
}): Promise<void> {
  await invokeNotify({
    type: "MENTIONED_IN_COMMENT",
    recipientId: params.recipientId,
    actorId: params.actorId,
    postId: params.postId,
  });
}

export async function notifyNewMessage(params: {
  recipientId: string;
  actorId: string;
}): Promise<void> {
  await invokeNotify({
    type: "NEW_MESSAGE",
    recipientId: params.recipientId,
    actorId: params.actorId,
  });
}
