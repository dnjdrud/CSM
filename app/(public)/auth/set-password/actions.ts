"use server";

import { consumePasswordReset } from "@/lib/auth/passwordReset";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Consume reset token and set new password via Supabase Auth Admin.
 * Finds user by email (listUsers), then updateUserById with new password.
 */
export async function submitSetPasswordAction(params: {
  id: string;
  token: string;
  password: string;
}): Promise<{ ok: true } | { error: string }> {
  const { id, token, password } = params;
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const emailResult = await consumePasswordReset(id, token);
  if (!emailResult) return { error: "This link is invalid or has expired. Request a new reset." };

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured." };

  const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = listData?.users?.find((u) => u.email?.toLowerCase() === emailResult.email.toLowerCase());
  if (!user?.id) return { error: "No account found for this email." };

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: trimmedPassword });
  if (error) return { error: error.message };

  return { ok: true };
}
