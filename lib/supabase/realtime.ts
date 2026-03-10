/**
 * Supabase Realtime helpers. Use in client components only.
 * Requires supabaseBrowser(). Table must be in supabase_realtime publication.
 */
import { supabaseBrowser } from "@/lib/supabase/client";
import { logWarnClient } from "@/lib/logging/clientLogger";
import { getClientAccessToken } from "@/lib/auth/parseClientCookie";

export type RealtimePayload<T = Record<string, unknown>> = {
  new: T;
  old: T;
};

export type SubscribeToTableOptions<T = Record<string, unknown>> = {
  table: string;
  /** PostgREST filter, e.g. "recipient_id=eq.xxx" */
  filter?: string;
  schema?: string;
  onInsert?: (payload: RealtimePayload<T>) => void;
  onUpdate?: (payload: RealtimePayload<T>) => void;
  onDelete?: (payload: RealtimePayload<T>) => void;
};

/**
 * Subscribe to postgres_changes for a table. Returns unsubscribe function.
 * Safe to call when realtime is disabled (no-op if supabase not available).
 */
export function subscribeToTable<T = Record<string, unknown>>(
  options: SubscribeToTableOptions<T>
): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: ReturnType<ReturnType<typeof supabaseBrowser>["channel"]> | null = null;

  try {
    const supabase = supabaseBrowser();
    const { table, filter, schema = "public", onInsert, onUpdate, onDelete } = options;

    // Authenticate realtime WebSocket with the user's JWT.
    // The browser client has persistSession:false so getSession() returns null;
    // we must set the token manually so RLS policies allow event delivery.
    const token = getClientAccessToken();
    if (token) {
      supabase.realtime.setAuth(token);
    }

    const channelName = `realtime:${schema}:${table}:${filter ?? "all"}`;
    channel = supabase.channel(channelName);

    const opts: { schema: string; table: string; filter?: string } = {
      schema,
      table,
    };
    if (filter) opts.filter = filter;

    if (onInsert) {
      channel.on("postgres_changes", { ...opts, event: "INSERT" }, (payload: RealtimePayload<T>) => onInsert(payload));
    }
    if (onUpdate) {
      channel.on("postgres_changes", { ...opts, event: "UPDATE" }, (payload: RealtimePayload<T>) => onUpdate(payload));
    }
    if (onDelete) {
      channel.on("postgres_changes", { ...opts, event: "DELETE" }, (payload: RealtimePayload<T>) => onDelete(payload));
    }

    channel.subscribe((status: string, err?: Error) => {
      if (err) {
        console.error("[CSM realtime]", table, status, err);
        logWarnClient("REALTIME", "Channel error", {
          table,
          status,
          error: err?.message ?? String(err),
        });
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[CSM realtime] subscribeToTable skipped", e);
    }
    return () => {};
  }
}
