/**
 * Client-side logger: sends to /api/internal/log so server can write to system_logs.
 * Fire-and-forget; never throws.
 */
import type { LogSource } from "./systemLogger";

const LOG_LEVELS = ["INFO", "WARN", "ERROR"] as const;

function send(
  level: (typeof LOG_LEVELS)[number],
  source: LogSource,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    void fetch("/api/internal/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, source, message, metadata }),
    });
  } catch {
    // never crash
  }
}

export function logInfoClient(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  send("INFO", source, message, metadata);
}

export function logWarnClient(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  send("WARN", source, message, metadata);
}

export function logErrorClient(source: LogSource, message: string, metadata?: Record<string, unknown>): void {
  send("ERROR", source, message, metadata);
}
