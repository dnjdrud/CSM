import { cookies } from "next/headers";
import { attemptParentLogin } from "@/server/login";
import { clientId, isSameOriginRequest, jsonNoStore, readJsonObject } from "@/server/request-guard";
import { introCookieName, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { PARENT_SESSION_SECONDS } from "@/server/session-token";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return jsonNoStore({ error: "forbidden" }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return jsonNoStore({ error: "invalid_request" }, 400);
  }

  // Plain JSON object only (null / array / primitive / oversized -> normal 400 or 413).
  const parsed = await readJsonObject(req, 4_000);
  if (!parsed.ok) return jsonNoStore({ error: parsed.status === 413 ? "too_large" : "invalid_request" }, parsed.status);
  const body: { role?: unknown; password?: unknown } = parsed.value;

  const result = attemptParentLogin(body.role, body.password, clientId(req));
  if (!result.ok) {
    switch (result.reason) {
      case "invalid_request":
        return jsonNoStore({ error: "invalid_request" }, 400);
      case "not_configured":
        return jsonNoStore({ error: "not_configured" }, 503);
      case "locked":
        return jsonNoStore({ error: "locked", retryAfterSeconds: result.retryAfterSeconds }, 429);
      case "wrong":
        return jsonNoStore({ error: "wrong", remaining: result.remaining }, 401);
    }
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, result.token, sessionCookieOptions(PARENT_SESSION_SECONDS));
  const role = result.payload.role as "mother" | "father";
  const seenIntro = store.get(introCookieName(role))?.value === "1";
  return jsonNoStore({ ok: true, next: seenIntro ? "/rooms" : "/welcome" });
}
