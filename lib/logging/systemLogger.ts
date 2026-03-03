/**
 * System logging to system_logs table. Server-only. Fails silently.
 * Uses admin client so inserts are not blocked by RLS.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type LogSource =
  | "SERVER_ACTION"
  | "REALTIME"
  | "EDGE_FUNCTION"
  | "GLOBAL";

export type LogLevel = "INFO" | "WARN" | "ERROR";

function write(level: LogLevel, source: LogSource, message: string, metadata?: Record<string, unknown>) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;
    void supabase
      .from("system_logs")
      .insert({
        level,
        source,
        message: message.slice(0, 5000),
        metadata: metadata ?? {},
      })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === "development") {
          console.warn("[systemLogger] insert failed", error.message);
        }
      });
  } catch {
    // never crash the app
  }
}

export function logInfo(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  write("INFO", source, message, metadata);
}

export function logWarn(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  write("WARN", source, message, metadata);
}

export function logError(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  write("ERROR", source, message, metadata);
}
