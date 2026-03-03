"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import { createInvite, updateInvite, revokeInvite, getInviteById } from "@/lib/data/inviteRepository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatExpires } from "@/lib/invites/render";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export type CreateInviteResult = { ok: true; code: string; inviteId: string } | { ok: false; error: string };
export type UpdateInviteResult = { ok: true } | { ok: false; error: string };
export type RevokeInviteResult = { ok: true } | { ok: false; error: string };
export type SendInviteEmailResult = { ok: true } | { ok: false; error: string };

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

/**
 * Send invite link/code to an email address. ADMIN only. Uses Edge Function send-invite-email (Resend).
 */
export async function sendInviteEmailAction(
  inviteId: string,
  toEmail: string
): Promise<SendInviteEmailResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Admin access required" };

  const trimmed = toEmail.trim();
  if (!trimmed) return { ok: false, error: "Email is required" };
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(trimmed)) return { ok: false, error: "Invalid email address" };

  const invite = await getInviteById(inviteId);
  if (!invite) return { ok: false, error: "Invite not found" };
  if (invite.status !== "ACTIVE") return { ok: false, error: "Only active invites can be sent" };

  const baseUrl = APP_URL.replace(/\/$/, "");
  const signInUrl = `${baseUrl}/onboarding`;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Email not configured. Set SUPABASE_SERVICE_ROLE_KEY and deploy send-invite-email Edge Function with RESEND_API_KEY, EMAIL_FROM." };
  }

  const { data, error } = await supabase.functions.invoke("send-invite-email", {
    body: {
      toEmail: trimmed,
      code: invite.code,
      signInUrl,
      note: invite.note ?? null,
      expiresAt: invite.expiresAt ? formatExpires(invite.expiresAt) : null,
      maxUses: invite.maxUses,
    },
  });

  if (error) {
    console.error("[sendInviteEmail] Edge function error", error);
    return { ok: false, error: error.message ?? "Failed to send email" };
  }
  if (data?.error) {
    return { ok: false, error: typeof data.error === "string" ? data.error : "Failed to send email" };
  }
  return { ok: true };
}
