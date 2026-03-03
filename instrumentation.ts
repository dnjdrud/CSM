/**
 * Next.js instrumentation. Runs once when the server starts.
 * Sentry server and edge init are triggered here so the SDK works correctly.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
