/**
 * Password reset token: create and consume. Tokens stored as hash in auth_password_resets.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateToken, hashToken, verifyToken } from "@/lib/auth/tokens";

const EXPIRY_HOURS = 24;

export type CreatePasswordResetResult = { id: string; rawToken: string; expiresAt: Date } | { error: string };

export async function createPasswordReset(email: string): Promise<CreatePasswordResetResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Email required" };

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

  const { data: row, error } = await admin
    .from("auth_password_resets")
    .insert({
      email: normalizedEmail,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!row) return { error: "Failed to create reset token" };
  return { id: row.id, rawToken, expiresAt };
}

export type ConsumePasswordResetResult = { email: string } | null;

/**
 * Verify token by row id, mark used, return email. Returns null if invalid/expired/used.
 */
/**
 * Verify token and return email without consuming. Use to show set-password form. Returns null if invalid/expired/used.
 */
export async function verifyPasswordResetToken(
  id: string,
  rawToken: string
): Promise<{ email: string } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = rawToken.trim();
  if (!trimmed || !id) return null;

  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("auth_password_resets")
    .select("id, email, token_hash, expires_at, used_at")
    .eq("id", id)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !row) return null;
  if (!verifyToken(trimmed, row.token_hash)) return null;
  return { email: row.email };
}

export async function consumePasswordReset(id: string, rawToken: string): Promise<ConsumePasswordResetResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = rawToken.trim();
  if (!trimmed || !id) return null;

  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("auth_password_resets")
    .select("id, email, token_hash, expires_at, used_at")
    .eq("id", id)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !row) return null;
  if (!verifyToken(trimmed, row.token_hash)) return null;

  const { error: updateErr } = await admin
    .from("auth_password_resets")
    .update({ used_at: now })
    .eq("id", row.id)
    .is("used_at", null);

  if (updateErr) return null;
  return { email: row.email };
}
