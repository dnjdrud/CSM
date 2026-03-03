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

export function buildSignInUrl(): string {
  const base = getRaw();
  return base ? `${base}/onboarding` : "/onboarding";
}
