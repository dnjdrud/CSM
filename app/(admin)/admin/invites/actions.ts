"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import { createInvite, updateInvite, revokeInvite } from "@/lib/data/inviteRepository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

export type CreateInviteResult = { ok: true; code: string; inviteId: string } | { ok: false; error: string };
export type UpdateInviteResult = { ok: true } | { ok: false; error: string };
export type RevokeInviteResult = { ok: true } | { ok: false; error: string };

/**
 * Create a new invite. ADMIN only. Form fields: maxUses, expiresPreset (7days|30days|custom), expiresAt (ISO when custom), note.
 */
export async function createInviteAction(formData: FormData): Promise<CreateInviteResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admin access required" };
  try {
    await assertRateLimit({ userId: admin.userId, action: "CREATE_INVITE", maxPerMinute: 3, maxPer10Min: 10 });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to create invite" };
  }

  const maxUsesRaw = formData.get("maxUses");
  const maxUses = Math.max(1, parseInt(String(maxUsesRaw), 10) || 1);
  const expiresPreset = formData.get("expiresPreset") as string | null;
  let expiresAt: string | null = null;
  if (expiresPreset === "7days") {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    expiresAt = d.toISOString();
  } else if (expiresPreset === "30days") {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    expiresAt = d.toISOString();
  } else if (expiresPreset === "custom") {
    const custom = formData.get("expiresAt") as string | null;
    if (custom?.trim()) expiresAt = new Date(custom.trim()).toISOString();
  }
  const note = (formData.get("note") as string | null)?.trim() || null;

  try {
    const invite = await createInvite({
      adminId: admin.userId,
      maxUses,
      expiresAt,
      note,
    });
    revalidatePath("/admin/invites");
    return { ok: true, code: invite.code, inviteId: invite.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create invite" };
  }
}

/**
 * Update invite settings. ADMIN only.
 */
export async function updateInviteAction(
  inviteId: string,
  payload: { maxUses?: number; expiresAt?: string | null; note?: string | null }
): Promise<UpdateInviteResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admin access required" };

  try {
    await updateInvite({
      adminId: admin.userId,
      inviteId,
      maxUses: payload.maxUses,
      expiresAt: payload.expiresAt,
      note: payload.note,
    });
    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update invite" };
  }
}

/**
 * Revoke an invite. ADMIN only.
 */
export async function revokeInviteAction(inviteId: string): Promise<RevokeInviteResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admin access required" };

  try {
    await revokeInvite(admin.userId, inviteId);
    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to revoke invite" };
  }
}
