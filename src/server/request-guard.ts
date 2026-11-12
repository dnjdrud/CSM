import "server-only";
import { getConfiguredOrigin } from "./config";

/**
 * Same-origin check for state-changing requests (CSRF defense in addition to
 * SameSite cookies). Requests without an Origin header are rejected.
 */
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  // Some browsers send "Origin: null" on HTML form POSTs (e.g. under strict referrer policies).
  // Accept that only when the browser itself marks the request same-origin (Sec-Fetch-Site
  // cannot be set by page scripts). Requests with no Origin at all are still rejected.
  if (origin === "null") return fetchSite === "same-origin";
  if (!origin) return false;

  const configured = getConfiguredOrigin();
  if (configured) return origin === configured;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  return originUrl.host === host;
}

/** Best-effort client identifier for rate limiting. Never logged or stored. */
export function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  return (first || req.headers.get("x-real-ip") || "direct").slice(0, 64);
}

export function jsonNoStore(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export type JsonObjectResult = { ok: true; value: Record<string, unknown> } | { ok: false; status: 400 | 413 };

/**
 * Reads a request body as a JSON OBJECT, with a byte limit.
 *  - A declared Content-Length above the limit is refused before reading anything.
 *  - Otherwise the body is streamed and reading stops as soon as the limit is passed, so a
 *    large or lying (chunked) body is never buffered whole by this code.
 *  - null, arrays, strings, numbers and malformed JSON are a normal 400, never an exception.
 * (A reverse proxy / platform body limit in front of the app is still recommended; this
 * only bounds what the route itself reads.)
 */
export async function readJsonObject(req: Request, maxBytes = 16_000): Promise<JsonObjectResult> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413 };
  if (!req.body) return { ok: false, status: 400 };

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    return { ok: false, status: 400 };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, status: 400 };
  return { ok: true, value: parsed as Record<string, unknown> };
}

/** True when the request says it carries JSON. */
export const isJsonRequest = (req: Request) => req.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
