import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CreatorSettingsClient } from "./_components/CreatorSettingsClient";

export default async function CreatorSettingsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <div className="px-4 py-8 text-center text-theme-muted text-[14px]">
        서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const { data: user } = await admin
    .from("users")
    .select("subscription_candles_per_month")
    .eq("id", userId)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-[20px] font-bold text-theme-text mb-1">크리에이터 구독 설정</h1>
      <p className="text-[13px] text-theme-muted mb-8">
        캔들로 구독을 받을 수 있도록 월 구독 가격을 설정하세요. (100원 = 1캔들)
      </p>

      <CreatorSettingsClient
        candlesPerMonth={user?.subscription_candles_per_month ?? null}
      />
    </div>
  );
}
