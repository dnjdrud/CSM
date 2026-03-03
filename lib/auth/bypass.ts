/**
 * Onboarding bypass: allowlisted emails skip onboarding and get auto-provisioned to public.users.
 *
 * ENV: ONBOARDING_BYPASS_EMAILS="a@b.com,c@d.com" (comma-separated, trim + lowercase).
 * If absent, falls back to ADMIN_EMAILS.
 */

const ONBOARDING_BYPASS_EMAILS_KEY = "ONBOARDING_BYPASS_EMAILS";
const ADMIN_EMAILS_KEY = "ADMIN_EMAILS";

function parseAllowlist(envKey: string): string[] {
  const raw = process.env[envKey];
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Emails that bypass onboarding (from ONBOARDING_BYPASS_EMAILS or ADMIN_EMAILS). */
export function getBypassAllowlistEmails(): string[] {
  const fromBypass = parseAllowlist(ONBOARDING_BYPASS_EMAILS_KEY);
  if (fromBypass.length > 0) return fromBypass;
  return parseAllowlist(ADMIN_EMAILS_KEY);
}

/** True if the given email is in the onboarding bypass allowlist (case-insensitive). */
export function isOnboardingBypassEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getBypassAllowlistEmails().includes(normalized);
}
