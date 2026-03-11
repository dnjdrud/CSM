"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/data/repository";
import { getUserById } from "@/lib/data/repository";
import { wrapServerAction } from "@/lib/utils/wrapServerAction";

export const markAllReadAction = wrapServerAction(
  async (): Promise<void> => {
    const session = await getSession();
    if (!session) return;
    await markAllNotificationsRead(session.userId);
    revalidatePath("/notifications");
    revalidatePath("/");
  },
  "markAllReadAction"
);

/** For realtime: resolve actor when a new notification arrives. Returns minimal public user. */
export const getPublicUserAction = wrapServerAction(
  async (userId: string): Promise<{ id: string; name: string } | null> => {
    const u = await getUserById(userId);
    if (!u) return null;
    return { id: u.id, name: u.name };
  },
  "getPublicUserAction"
);
