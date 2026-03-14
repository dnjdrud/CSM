/**
 * Magic link (passwordless login) token: create and consume. Tokens stored as hash in auth_magic_links.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateToken, hashToken, verifyToken } from "@/lib/auth/tokens";

const EXPIRY_HOURS = 1;

export type CreateMagicLinkResult = { id: string; rawToken: string; expiresAt: Date } | { error: string };

export async function createMagicLink(email: string): Promise<CreateMagicLinkResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Email required" };

  // Only allow magic links for users who have already been admin-approved and registered.
  // signup_requests.status = COMPLETED is the authoritative record of approval.
  // Admin-allowlisted emails (ADMIN_EMAILS env) skip this check.
  const { isAdminEmail } = await import("@/lib/admin/bootstrap");
  if (!isAdminEmail(normalizedEmail)) {
    const { data: signupReq } = await admin
      .from("signup_requests")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("status", "COMPLETED")
      .maybeSingle();
    if (!signupReq) {
      // Sentinel: route handler will return { ok: true } without sending email (no enumeration).
      return { error: "USER_NOT_FOUND" };
    }
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

  const { data: row, error } = await admin
    .from("auth_magic_links")
    .insert({
      email: normalizedEmail,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!row) return { error: "Failed to create magic link" };
  return { id: row.id, rawToken, expiresAt };
}

export type ConsumeMagicLinkResult = { email: string } | null;

/**
 * Verify token by row id, mark used, return email. Returns null if invalid/expired/used.
 */
export async function consumeMagicLink(id: string, rawToken: string): Promise<ConsumeMagicLinkResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = rawToken.trim();
  if (!trimmed || !id) return null;

  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("auth_magic_links")
    .select("id, email, token_hash, expires_at, used_at")
    .eq("id", id)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !row) return null;
  if (!verifyToken(trimmed, row.token_hash)) return null;

  const { error: updateErr } = await admin
    .from("auth_magic_links")
    .update({ used_at: now })
    .eq("id", row.id)
    .is("used_at", null);

  if (updateErr) return null;
  return { email: row.email };
}
