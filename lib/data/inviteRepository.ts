/**
 * Invite code data access. Admin creates with max_uses/expires/note; users consume via RPC.
 * All mutations log audit. Uses supabaseServer(); requires public.invite_codes and RLS.
 */
import type { InviteCode, InviteStatus, InviteValidationOutcome } from "@/lib/domain/types";
import { ADMIN_ACTION, AUDIT_TARGET_TYPE } from "@/lib/admin/constants";
import { logAdminAction } from "@/lib/admin/audit";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

const CODE_LENGTH = 10;
/** Uppercase, no ambiguous: 0,O,I,L,1 */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function computeStatus(row: {
  revoked_at: string | null;
  expires_at: string | null;
  uses_count: number;
  max_uses: number;
}): InviteStatus {
  if (row.revoked_at != null) return "REVOKED";
  if (row.expires_at != null && new Date(row.expires_at) <= new Date()) return "EXPIRED";
  if (row.uses_count >= row.max_uses) return "USED_UP";
  return "ACTIVE";
}

function rowToInvite(r: {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string | null;
  note: string | null;
  expires_at: string | null;
  max_uses: number;
  uses_count: number;
  revoked_at: string | null;
  revoked_by: string | null;
}): InviteCode {
  const status = computeStatus(r);
  return {
    id: r.id,
    code: r.code,
    createdBy: r.created_by,
    usedBy: r.used_by ?? undefined,
    usedAt: r.used_at ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    note: r.note ?? undefined,
    expiresAt: r.expires_at ?? undefined,
    maxUses: r.max_uses,
    usesCount: r.uses_count,
    revokedAt: r.revoked_at ?? undefined,
    revokedBy: r.revoked_by ?? undefined,
    status,
  };
}

/** Generate short readable code (8–10 chars, uppercase, no ambiguous). */
function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  return s;
}

export interface CreateInviteInput {
  adminId: string;
  maxUses: number;
  expiresAt?: string | null; // ISO
  note?: string | null;
}

/**
 * Create a new invite. Generates unique code; logs CREATE_INVITE.
 */
export async function createInvite(input: CreateInviteInput): Promise<InviteCode> {
  const supabase = await supabaseServer();
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    const code = generateCode();
    const { data: inserted, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        created_by: input.adminId,
        max_uses: input.maxUses,
        expires_at: input.expiresAt ?? null,
        note: input.note ?? null,
        uses_count: 0,
      })
      .select()
      .single();
    if (!error && inserted) {
      await logAdminAction({
        actorId: input.adminId,
        action: ADMIN_ACTION.CREATE_INVITE,
        targetType: AUDIT_TARGET_TYPE.INVITE,
        targetId: inserted.id,
        metadata: { inviteId: inserted.id, code },
      });
      return rowToInvite(inserted);
    }
    if (error?.code === "23505") {
      attempts++;
      continue;
    }
    throw new Error(error?.message ?? "Failed to create invite");
  }
  throw new Error("Failed to generate unique invite code");
}

/**
 * List all invites with computed status. Admin only (RLS).
 */
export async function listInvites(): Promise<InviteCode[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("invite_codes")
    .select("id, code, created_by, used_by, used_at, created_at, note, expires_at, max_uses, uses_count, revoked_at, revoked_by")
    .order("created_at", { ascending: false });
  return (rows ?? []).map(rowToInvite);
}

export interface UpdateInviteInput {
  adminId: string;
  inviteId: string;
  maxUses?: number;
  expiresAt?: string | null;
  note?: string | null;
}

/**
 * Update invite settings. ADMIN only. Logs UPDATE_INVITE with changes.
 */
export async function updateInvite(input: UpdateInviteInput): Promise<InviteCode> {
  const supabase = await supabaseServer();
  const payload: Record<string, unknown> = {};
  if (input.maxUses !== undefined) payload.max_uses = input.maxUses;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt;
  if (input.note !== undefined) payload.note = input.note;

  if (Object.keys(payload).length === 0) {
    const { data } = await supabase.from("invite_codes").select("*").eq("id", input.inviteId).single();
    if (!data) throw new Error("Invite not found");
    return rowToInvite(data);
  }

  const { data: updated, error } = await supabase
    .from("invite_codes")
    .update(payload)
    .eq("id", input.inviteId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Invite not found");

  await logAdminAction({
    actorId: input.adminId,
    action: ADMIN_ACTION.UPDATE_INVITE,
    targetType: AUDIT_TARGET_TYPE.INVITE,
    targetId: input.inviteId,
    metadata: { inviteId: input.inviteId, code: updated.code, changes: payload },
  });
  return rowToInvite(updated);
}

/**
 * Revoke an invite. Sets revoked_at and revoked_by. Logs REVOKE_INVITE.
 */
export async function revokeInvite(adminId: string, inviteId: string, reason?: string): Promise<InviteCode> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("invite_codes")
    .update({ revoked_at: now, revoked_by: adminId })
    .eq("id", inviteId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Invite not found");

  await logAdminAction({
    actorId: adminId,
    action: ADMIN_ACTION.REVOKE_INVITE,
    targetType: AUDIT_TARGET_TYPE.INVITE,
    targetId: inviteId,
    metadata: { inviteId, code: updated.code, reason: reason ?? undefined },
  });
  return rowToInvite(updated);
}

/**
 * List invite codes (legacy alias). Prefer listInvites() for admin UI.
 */
export async function listInviteCodes(): Promise<InviteCode[]> {
  return listInvites();
}

const MIN_CODE_LENGTH = 6;

function validateFromRow(row: {
  revoked_at: string | null;
  expires_at: string | null;
  uses_count: number;
  max_uses: number;
}): InviteValidationOutcome {
  const status = computeStatus(row);
  if (status === "ACTIVE") return "VALID";
  if (status === "EXPIRED" || status === "REVOKED") return "EXPIRED";
  if (status === "USED_UP") return "USED";
  return "INVALID";
}

/**
 * Validate an invite code (read-only). Returns canonical outcome for UX.
 * Does not consume the code. Use for gate step and pre-check before redeem.
 * Uses current session (supabaseServer); for unauthenticated use validateInviteCodeForSignup.
 */
export async function validateInviteCode(code: string): Promise<InviteValidationOutcome> {
  const trimmed = code.trim();
  if (trimmed.length < MIN_CODE_LENGTH) return "INVALID";

  try {
    const supabase = await supabaseServer();
    const { data: row, error } = await supabase
      .from("invite_codes")
      .select("id, revoked_at, expires_at, uses_count, max_uses")
      .eq("code", trimmed)
      .maybeSingle();

    if (error || !row) return "INVALID";
    return validateFromRow(row);
  } catch {
    return "INVALID";
  }
}

/**
 * Validate invite code for pre-signup gate (magic link step). Uses admin client so it works when user is not authenticated.
 */
export async function validateInviteCodeForSignup(code: string): Promise<InviteValidationOutcome> {
  const trimmed = code.trim();
  if (trimmed.length < MIN_CODE_LENGTH) return "INVALID";

  const admin = getSupabaseAdmin();
  if (!admin) return "INVALID";

  try {
    const { data: row, error } = await admin
      .from("invite_codes")
      .select("id, revoked_at, expires_at, uses_count, max_uses")
      .eq("code", trimmed)
      .maybeSingle();

    if (error || !row) return "INVALID";
    return validateFromRow(row);
  } catch {
    return "INVALID";
  }
}

/**
 * Consume an invite (legacy). Prefer RPC create_user_with_invite for onboarding.
 */
export async function consumeInviteCode(code: string, userId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const trimmed = code.trim();
  if (!trimmed) return false;
  const { data: row } = await supabase
    .from("invite_codes")
    .select("id, uses_count, max_uses")
    .eq("code", trimmed)
    .is("revoked_at", null)
    .maybeSingle();
  if (!row || row.uses_count >= row.max_uses) return false;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("invite_codes")
    .update({
      uses_count: row.uses_count + 1,
      used_by: row.max_uses === 1 ? userId : undefined,
      used_at: row.max_uses === 1 ? now : undefined,
    })
    .eq("id", row.id);
  return !error;
}
