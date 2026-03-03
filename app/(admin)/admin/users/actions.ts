"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import {
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  changeUserRole,
} from "@/lib/data/adminRepository";
import type { UserRole } from "@/lib/domain/types";

export async function blockUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await blockUser(admin.userId, userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function unblockUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await unblockUser(admin.userId, userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function muteUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await muteUser(admin.userId, userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function unmuteUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await unmuteUser(admin.userId, userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function changeUserRoleAction(userId: string, role: UserRole): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await changeUserRole(admin.userId, userId, role);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
