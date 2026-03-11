"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminOrNull } from "@/lib/admin/guard";
import { createDailyPrayer } from "@/lib/data/adminRepository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

export async function createDailyPrayerAction(customContent?: string): Promise<{ ok: true; postId: string; reused: boolean } | { ok: false; error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/feed?message=admin_required");
  try {
    await assertRateLimit({ userId: admin.userId, action: "CREATE_DAILY_PRAYER", maxPerMinute: 2, maxPer10Min: 5 });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed" };
  }
  try {
    const { postId, reused } = await createDailyPrayer(admin.userId, customContent);
    revalidatePath("/feed");
    revalidatePath("/admin");
    return { ok: true, postId, reused };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
