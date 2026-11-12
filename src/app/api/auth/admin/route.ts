import { cookies } from "next/headers";
import { attemptAdminLogin } from "@/server/login";
import { clientId, isSameOriginRequest, jsonNoStore, readJsonObject } from "@/server/request-guard";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { ADMIN_SESSION_SECONDS } from "@/server/session-token";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return jsonNoStore({ error: "forbidden" }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return jsonNoStore({ error: "invalid_request" }, 400);
  }

  // Plain JSON object only (null / array / primitive / oversized -> normal 400 or 413).
  const parsed = await readJsonObject(req, 4_000);
  if (!parsed.ok) return jsonNoStore({ error: parsed.status === 413 ? "too_large" : "invalid_request" }, parsed.status);
  const body: { password?: unknown } = parsed.value;

  const result = attemptAdminLogin(body.password, clientId(req));
  if (!result.ok) {
    switch (result.reason) {
      case "invalid_request":
        return jsonNoStore({ error: "invalid_request" }, 400);
      case "not_configured":
        return jsonNoStore({ error: "not_configured" }, 503);
      case "locked":
        return jsonNoStore({ error: "locked", retryAfterSeconds: result.retryAfterSeconds }, 429);
      case "wrong":
        // Remaining attempts are not disclosed for the admin account.
        return jsonNoStore({ error: "wrong" }, 401);
    }
  }

  (await cookies()).set(SESSION_COOKIE, result.token, sessionCookieOptions(ADMIN_SESSION_SECONDS));
  return jsonNoStore({ ok: true, next: "/admin" });
}
