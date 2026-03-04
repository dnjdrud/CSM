/**
 * 승인제 플로우: 관리자가 이메일로 초대 링크를 보내면 auth_invites에 token_hash로 저장.
 * 사용자가 /onboarding?token=... 로 접속 후 가입 폼 제출 시 consumeInvite로 검증 후 1회 사용 처리.
 * 동일 이메일로 미사용 초대가 있으면 기존 것은 used_at으로 revoke 하고 새 초대를 발급.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateToken, hashToken, verifyToken } from "@/lib/auth/tokens";

const INVITE_EXPIRY_DAYS = 7;

export type CreateInviteResult = { rawToken: string; expiresAt: Date } | { error: string };

/**
 * Create invite for email. If there is an existing unused invite for this email, revoke it and create a new one.
 * Returns rawToken (send in URL only once) and expiresAt. Store only hash in DB.
 */
export async function createInvite(
  email: string,
  createdBy?: string | null
): Promise<CreateInviteResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Email required" };

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Revoke any existing unused invite for this email
  const { data: existing } = await admin
    .from("auth_invites")
    .select("id")
    .eq("email", normalizedEmail)
    .is("used_at", null)
    .gt("expires_at", now.toISOString());

  if (existing && existing.length > 0) {
    await admin
      .from("auth_invites")
      .update({ used_at: now.toISOString() })
      .eq("email", normalizedEmail)
      .is("used_at", null);
  }

  const { error } = await admin.from("auth_invites").insert({
    email: normalizedEmail,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    created_by: createdBy ?? null,
  });

  if (error) return { error: error.message };
  return { rawToken, expiresAt };
}

export type InviteRow = {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

/**
 * Verify raw token, mark as used, return invite row. Returns null if invalid/expired/already used.
 */
export async function consumeInvite(rawToken: string): Promise<InviteRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = rawToken.trim();
  if (!trimmed) return null;

  const now = new Date().toISOString();

  const { data: rows } = await admin
    .from("auth_invites")
    .select("id, email, token_hash, expires_at, used_at, created_at, created_by")
    .is("used_at", null)
    .gt("expires_at", now);

  if (!rows?.length) return null;

  const row = rows.find((r) => verifyToken(trimmed, r.token_hash));
  if (!row) return null;

  const { error } = await admin
    .from("auth_invites")
    .update({ used_at: now })
    .eq("id", row.id)
    .is("used_at", null);

  if (error) return null;

  return {
    id: row.id,
    email: row.email,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/**
 * Verify invite token without consuming. Use to show onboarding form. Returns email if valid.
 */
export async function verifyInvite(rawToken: string): Promise<{ email: string } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = rawToken.trim();
  if (!trimmed) return null;

  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("auth_invites")
    .select("id, email, token_hash, expires_at, used_at")
    .is("used_at", null)
    .gt("expires_at", now);

  if (!rows?.length) return null;
  const row = rows.find((r) => verifyToken(trimmed, r.token_hash));
  return row ? { email: row.email } : null;
}

/**
 * Get latest unused invite for email, if any. Optional helper for admin UI.
 */
export async function getInviteByEmail(email: string): Promise<InviteRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const now = new Date().toISOString();
  const { data: row } = await admin
    .from("auth_invites")
    .select("id, email, expires_at, used_at, created_at, created_by")
    .eq("email", email.trim().toLowerCase())
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/**
 * Consume invite token and create Auth user + public.users row. For /onboarding?token= invite flow.
 */
export async function createUserFromInvite(params: {
  token: string;
  password: string;
  name: string;
}): Promise<{ ok: true; email: string } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const invite = await consumeInvite(params.token);
  if (!invite) return { error: "This invite link is invalid or has expired." };

  const email = invite.email.trim().toLowerCase();
  const password = params.password.trim();
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const name = params.name?.trim() || "Member";

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already been registered"))
      return { error: "This email is already registered. Please sign in." };
    return { error: createError.message };
  }
  if (!authUser?.user?.id) return { error: "Failed to create account." };

  const { error: userErr } = await admin.from("users").upsert(
    {
      id: authUser.user.id,
      name,
      role: "LAY",
      church: null,
      bio: null,
      affiliation: null,
      username: null,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (userErr) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: userErr.message };
  }

  return { ok: true, email };
}
