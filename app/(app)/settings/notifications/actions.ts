"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, updateNotificationPrefs } from "@/lib/data/repository";
import type { NotificationPrefs } from "@/lib/domain/types";

export async function updateNotifPrefsAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs: Partial<NotificationPrefs> = {
    pushComments:        formData.get("pushComments")        === "on",
    pushReactions:       formData.get("pushReactions")       === "on",
    pushFollowers:       formData.get("pushFollowers")       === "on",
    pushCellMessages:    formData.get("pushCellMessages")    === "on",
    pushPrayerResponses: formData.get("pushPrayerResponses") === "on",
    emailWeeklyDigest:   formData.get("emailWeeklyDigest")   === "on",
    emailCellInvites:    formData.get("emailCellInvites")    === "on",
  };

  await updateNotificationPrefs(user.id, prefs);
  revalidatePath("/settings/notifications");
}
