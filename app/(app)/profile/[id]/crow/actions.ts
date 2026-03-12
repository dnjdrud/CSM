"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserId } from "@/lib/auth/session";
import { toggleSubscription } from "@/lib/data/subscriptionRepository";

export async function toggleSubscriptionAction(
  creatorId: string
): Promise<{ result: "subscribed" | "unsubscribed" } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };
  if (userId === creatorId) return { error: "자신을 구독할 수 없습니다." };

  const result = await toggleSubscription(userId, creatorId);

  // 구독자의 Crow 탭 + 크리에이터 프로필 모두 갱신
  revalidatePath(`/profile/${userId}`);
  revalidatePath(`/profile/${creatorId}`);

  return { result };
}
