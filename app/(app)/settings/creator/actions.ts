"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MIN_CANDLES = 5;

/** 크리에이터가 월 구독 캔들 가격을 설정 (최소 5캔들 = 500원) */
export async function updateCreatorCandlePriceAction(
  candlesPerMonth: number
): Promise<{ ok: true } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };

  if (!Number.isInteger(candlesPerMonth) || candlesPerMonth < MIN_CANDLES) {
    return { error: `최소 구독 가격은 ${MIN_CANDLES}캔들 (${(MIN_CANDLES * 100).toLocaleString()}원)입니다.` };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "서버 오류가 발생했습니다." };

  const { error } = await admin
    .from("users")
    .update({ subscription_candles_per_month: candlesPerMonth })
    .eq("id", userId);

  if (error) return { error: "저장에 실패했습니다." };

  revalidatePath("/settings/creator");
  return { ok: true };
}

/** 크리에이터 구독 비활성화 */
export async function disableCreatorSubscriptionAction(): Promise<
  { ok: true } | { error: string }
> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "서버 오류가 발생했습니다." };

  const { error } = await admin
    .from("users")
    .update({ subscription_candles_per_month: null })
    .eq("id", userId);

  if (error) return { error: "저장에 실패했습니다." };

  revalidatePath("/settings/creator");
  return { ok: true };
}
