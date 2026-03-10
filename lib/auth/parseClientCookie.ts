/**
 * Parse the Supabase access_token from browser cookies (client-side only).
 * Needed to authenticate Realtime WebSocket connections, since the browser
 * Supabase client has persistSession:false and returns no session.
 * Cookies are readable (httpOnly: false) per project auth setup.
 */

function decodeBase64URL(str: string): string | null {
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

export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const cookieName = `sb-${projectRef}-auth-token`;

    // Parse document.cookie into a map
    const cookieMap: Record<string, string> = {};
    document.cookie.split(";").forEach((part) => {
      const eq = part.indexOf("=");
      if (eq < 0) return;
      cookieMap[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
    });

    // Single cookie or chunked (.0, .1, …)
    let raw = "";
    if (cookieMap[cookieName]) {
      raw = cookieMap[cookieName];
    } else {
      for (let i = 0; ; i++) {
        const chunk = cookieMap[`${cookieName}.${i}`];
        if (!chunk) break;
        raw += chunk;
      }
    }
    if (!raw) return null;

    let sessionStr: string;
    if (raw.startsWith("base64-")) {
      const decoded = decodeBase64URL(raw.slice(7));
      if (!decoded) return null;
      sessionStr = decoded;
    } else {
      sessionStr = raw;
    }

    const session = JSON.parse(sessionStr) as { access_token?: string; expires_at?: number };
    if (!session.access_token || !session.expires_at) return null;

    // Reject genuinely expired tokens (5 min grace same as server)
    if (session.expires_at * 1000 < Date.now() - 5 * 60 * 1000) return null;

    return session.access_token;
  } catch {
    return null;
  }
}
