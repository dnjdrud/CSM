/**
 * Parse URL hash fragment into key-value pairs. Safe for client-side; no secrets logged.
 * Used by /auth/callback page for token_hash / access_token flow when fragment is not sent to server.
 */
export function parseHashParams(hash: string): Record<string, string> {
  if (!hash || !hash.startsWith("#")) return {};
  const query = hash.slice(1);
  const params: Record<string, string> = {};
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq).replace(/\+/g, " "));
    const value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " "));
    params[key] = value;
  }
  return params;
}

export function getTokensFromHash(hash: string): {
  access_token: string | null;
  refresh_token: string | null;
  error: string | null;
  error_description: string | null;
} {
  const p = parseHashParams(hash);
  return {
    access_token: p.access_token ?? null,
    refresh_token: p.refresh_token ?? null,
    error: p.error ?? null,
    error_description: p.error_description ?? null,
  };
}
