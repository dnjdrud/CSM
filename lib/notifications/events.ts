/**
 * Notification events: invoke notify Edge Function. Server-only (used from repository).
 * On failure: log and continue; do not fail the main action.
 */
import { supabaseServer } from "@/lib/supabase/server";

type NotifyPayload = {
  type: "FOLLOWED_YOU" | "COMMENTED_ON_YOUR_POST" | "REACTED_TO_YOUR_POST";
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
