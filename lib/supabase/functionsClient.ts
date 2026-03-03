/**
 * Invoke the notify Edge Function. Uses browser client (for client components).
 * For server-side invocation (e.g. from repository), use lib/notifications/events.ts.
 */
import { supabaseBrowser } from "@/lib/supabase/client";

export type NotifyPayload = {
  type: "FOLLOWED_YOU" | "COMMENTED_ON_YOUR_POST" | "REACTED_TO_YOUR_POST";
  recipientId: string;
  actorId: string;
  postId?: string;
};

export type NotifyResult = { ok: true; inserted: boolean } | { error: string };

export async function callNotify(payload: NotifyPayload): Promise<NotifyResult> {
  const { data, error } = await supabaseBrowser().functions.invoke("notify", {
    body: payload,
  });
  if (error) return { error: error.message };
  if (data?.ok === true && typeof data?.inserted === "boolean") {
    return { ok: true, inserted: data.inserted };
  }
  return { error: (data?.error as string) ?? "Unknown response" };
}
