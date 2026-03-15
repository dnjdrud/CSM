import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CandleShopClient } from "./_components/CandleShopClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "캔들 충전 – Cellah" };

export default async function CandlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
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

  const [{ data: user }, params] = await Promise.all([
    admin.from("users").select("candle_balance").eq("id", userId).single(),
    searchParams,
  ]);

  const { data: transactions } = await admin
    .from("candle_transactions")
    .select("id, delta, balance_after, kind, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const purchased = params.purchased === "true";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-[20px] font-bold text-theme-text mb-1">캔들 충전</h1>
      <p className="text-[13px] text-theme-muted mb-8">
        캔들을 충전하여 크리에이터를 구독하세요. 100원 = 1캔들
      </p>

      {purchased && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-[14px] text-green-700">
          캔들 충전이 완료되었습니다. 잔액이 업데이트되었습니다.
        </div>
      )}

      <CandleShopClient
        balance={user?.candle_balance ?? 0}
        userId={userId}
        transactions={
          (transactions ?? []).map((t) => ({
            id: t.id,
            delta: t.delta,
            balanceAfter: t.balance_after,
            kind: t.kind as "purchase" | "subscribe" | "refund" | "admin",
            note: t.note ?? null,
            createdAt: t.created_at,
          }))
        }
      />
    </div>
  );
}
