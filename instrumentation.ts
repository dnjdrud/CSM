/**
 * Next.js instrumentation. Runs once when the server starts.
 * Sentry server and edge init are triggered here so the SDK works correctly.
 * Supabase: suppress noisy console.warn for getSession() "insecure" and refresh_token_already_used.
 */
function suppressSupabaseConsoleNoise() {
  const shouldSuppress = (...args: unknown[]) => {
    const first = args[0];
    const msg = first != null ? String(first) : "";
    const err = first && typeof first === "object" && "message" in first ? String((first as { message?: unknown }).message) : "";
    const code = first && typeof first === "object" && "code" in first ? String((first as { code?: unknown }).code) : "";
    const combined = [msg, err, code, ...args.slice(1).map(String)].join(" ");
    return (
      (combined.includes("getSession()") && combined.includes("insecure")) ||
      combined.includes("Use supabase.auth.getUser() instead") ||
      combined.includes("Invalid Refresh Token: Already Used") ||
      combined.includes("refresh_token_already_used")
    );
  };
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(...args)) return;
    originalWarn.apply(console, args);
  };
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(...args)) return;
    originalError.apply(console, args);
  };
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    suppressSupabaseConsoleNoise();
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    suppressSupabaseConsoleNoise();
    await import("./sentry.edge.config");
  }
}
