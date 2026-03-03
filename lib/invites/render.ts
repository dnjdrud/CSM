/**
 * Template variable substitution and cleanup for invite messages.
 */
import { buildSignInUrl } from "@/lib/url/site";

export function formatExpires(expiresAt?: string | Date | null): string {
  if (expiresAt == null || (typeof expiresAt === "string" && expiresAt.trim() === "")) {
    return "No expiry.";
  }
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function replaceAll(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

/**
 * Replace {VAR} tokens, drop empty Note/Personal lines, collapse 3+ blank lines to max 2, trim.
 */
export function renderInviteTemplate(template: string, vars: Record<string, string>): string {
  let raw = template;
  if (!(vars["PERSONAL"] ?? "").trim()) {
    raw = raw
      .split("\n")
      .filter((line) => line.trim() !== "{PERSONAL}")
      .join("\n");
  }
  let out = replaceAll(raw, vars);

  if (!(vars["NOTE"] ?? "").trim()) {
    out = out
      .split("\n")
      .filter((line) => !line.includes("Note:"))
      .join("\n");
  }

  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[ \t]+$/gm, "");
  return out.trim();
}

/**
 * Build default vars for an invite (code, sign-in URL, expires, max uses, note).
 * PERSONAL is left empty for the composer to fill.
 */
export function buildInviteVars(opts: {
  code: string;
  expiresAt?: string | null;
  maxUses: number;
  note?: string | null;
  personal?: string;
}): Record<string, string> {
  return {
    CODE: opts.code,
    SIGNIN_URL: buildSignInUrl(),
    EXPIRES_AT: formatExpires(opts.expiresAt),
    MAX_USES: String(opts.maxUses),
    NOTE: opts.note?.trim() ?? "",
    PERSONAL: opts.personal?.trim() ?? "",
  };
}
