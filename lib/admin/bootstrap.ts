/**
 * Admin bootstrap: grant ADMIN role when auth email is in ADMIN_EMAILS allowlist.
 * Call ensureAdminRoleIfAllowed() from getSession() so every request can self-heal.
 */

const ADMIN_EMAILS_KEY = "ADMIN_EMAILS";

function parseAllowlist(): string[] {
  const raw = process.env[ADMIN_EMAILS_KEY];
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Emails that can log in and complete onboarding without an invite code (bootstrap admin). */
const BOOTSTRAP_ADMIN_EMAILS = ["dndnjsrud123@gmail.com"];

/** True if the given email is in the ADMIN_EMAILS allowlist (case-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (BOOTSTRAP_ADMIN_EMAILS.includes(normalized)) return true;
  const allowlist = parseAllowlist();
  return allowlist.includes(normalized);
}

/** True if this email can complete onboarding without an invite code (admin bootstrap). */
export function canSkipInviteForOnboarding(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}

/**
 * If the current auth user's email is in ADMIN_EMAILS, set public.users.role = 'ADMIN'.
 * Idempotent and safe; does not throw on failure.
 */
export async function ensureAdminRoleIfAllowed(): Promise<void> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) return;
    if (!isAdminEmail(user.email)) return;
    await supabase.from("users").update({ role: "ADMIN" }).eq("id", user.id);
  } catch (e) {
    console.warn("[admin bootstrap] ensureAdminRoleIfAllowed failed:", e);
  }
}
