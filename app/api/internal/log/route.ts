import { NextResponse } from "next/server";
import { logInfo, logWarn, logError } from "@/lib/logging/systemLogger";
import type { LogSource } from "@/lib/logging/systemLogger";

type Body = {
  level: "INFO" | "WARN" | "ERROR";
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * POST /api/internal/log
 * Client-side logging (realtime errors, global errors). Server writes to system_logs.
 * Same-origin only in practice. Fails silently.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const { level, source, message, metadata } = body;
    if (!level || !source || !message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (level === "INFO") logInfo(source, message, metadata);
    else if (level === "WARN") logWarn(source, message, metadata);
    else if (level === "ERROR") logError(source, message, metadata);
    else return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
