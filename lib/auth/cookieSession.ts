/**
 * Stateless session utilities: parse user ID from auth cookies without using the
 * Supabase SDK. This avoids:
 *   - _callRefreshToken() network calls that consume the refresh token
 *   - _removeSession() → SIGNED_OUT → setAll([maxAge:0]) that delete browser cookies
 *   - Any writable-cookie side effects in background/polling contexts
 *
 * Compatible with both Edge Runtime (middleware) and Node.js Runtime (Route Handlers).
 * Uses only Web APIs: atob, TextDecoder, Uint8Array.
 */

/**
 * Decode a base64url string to a UTF-8 string.
 * Handles multi-byte characters correctly via TextDecoder.
 */
export function decodeBase64URL(str: string): string | null {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "==".slice(0, (4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Parse the Supabase auth user ID from a list of cookies without SDK involvement.
 *
 * Reads the @supabase/ssr v0.8.0 base64url-encoded auth cookie, decodes it, and
 * extracts the user ID from the access token JWT payload. Returns null if:
 *   - No auth cookie is found
 *   - The cookie cannot be decoded/parsed
 *   - The access token is genuinely expired (exp < now)
 *
 * Note: this intentionally does NOT check the EXPIRY_MARGIN_MS (90s) early-expiry window
 * that the SDK uses to trigger a proactive refresh. Tokens within that window are still
 * technically valid; the RSC or next middleware run will handle the refresh properly.
 */
export function getUserIdFromCookies(
  allCookies: Array<{ name: string; value: string }>,
  supabaseUrl: string
): string | null {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    // Find auth cookie (single) or chunked variants (.0, .1, …)
    let cookieValue = "";
    const single = allCookies.find((c) => c.name === cookieName);
    if (single) {
      cookieValue = single.value;
    } else {
      for (let i = 0; ; i++) {
        const chunk = allCookies.find((c) => c.name === `${cookieName}.${i}`);
        if (!chunk) break;
        cookieValue += chunk.value;
      }
    }

    if (!cookieValue) return null;

    // Decode @supabase/ssr v0.8.0 base64url-encoded cookie value ("base64-…")
    let sessionStr: string;
    if (cookieValue.startsWith("base64-")) {
      const decoded = decodeBase64URL(cookieValue.slice(7));
      if (!decoded) return null;
      sessionStr = decoded;
    } else {
      sessionStr = cookieValue;
    }

    const session = JSON.parse(sessionStr) as {
      access_token?: string;
      expires_at?: number;
      user?: { id?: string };
    };
    console.log("Parsed session keys:", Object.keys(session), "has access_token:", !!session.access_token, "has user.id:", !!session.user?.id);
    if (!session.expires_at) return null;

    // 유예: 만료 후 5분까지는 허용. 같은 요청에서 미들웨어가 이미 리프레시했을 수 있어,
    // RSC가 SDK를 부르지 않고 쿠키만으로 세션을 쓰도록 함.
    const now = Date.now();
    const expiresMs = session.expires_at * 1000;
    if (expiresMs < now - 5 * 60 * 1000) return null;

    // 1) 세션에 user.id가 있으면 사용 (Supabase 저장 형식)
    if (session.user?.id) return session.user.id;

    // 2) JWT payload의 sub 사용
    if (!session.access_token) return null;
    const parts = session.access_token.split(".");
    console.log("JWT parts length:", parts.length);
    if (parts.length !== 3) return null;
    const payloadStr = decodeBase64URL(parts[1]);
    console.log("payloadStr:", payloadStr ? "parsed" : "null");
    if (!payloadStr) return null;
    const payload = JSON.parse(payloadStr) as { sub?: string };
    console.log("payload.sub:", payload.sub);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
