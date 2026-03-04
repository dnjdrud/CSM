/**
 * Site URL helpers. No hardcoded preview domains.
 */

function getRaw(): string {
  if (typeof process === "undefined") return "";
  const u = process.env.NEXT_PUBLIC_SITE_URL;
  if (u == null || u === "") return "";
  return String(u).trim().replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return getRaw();
}

/**
 * Server-only. Base URL for email links (magic link, reset, invite, approval).
 * Prefer SITE_URL so links use your custom domain and don't hit Vercel Deployment Protection.
 * Set SITE_URL=https://cellah.co.kr in Vercel Environment Variables (no rebuild needed).
 */
export function getBaseUrlForLinks(request?: Request): string {
  const s = process.env.SITE_URL?.trim();
  if (s) return s.replace(/\/+$/, "");
  const n = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (n) return n.startsWith("http") ? n.replace(/\/+$/, "") : `https://${n}`;
  const a = process.env.APP_URL?.trim();
  if (a) return a.replace(/\/+$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) return v.startsWith("http") ? v.replace(/\/+$/, "") : `https://${v}`;
  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {
      // ignore
    }
  }
  return "http://localhost:3000";
}

export function buildSignInUrl(): string {
  const base = getRaw();
  return base ? `${base}/onboarding` : "/onboarding";
}
