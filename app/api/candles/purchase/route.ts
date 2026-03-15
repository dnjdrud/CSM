import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCandlePack } from "@/lib/stripe";

/**
 * POST /api/candles/purchase
 * 캔들 팩 구매를 위한 pending record를 생성하고
 * Toss Payments 위젯에 필요한 주문 정보를 반환합니다.
 */
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { packId?: string };
  const pack = getCandlePack(body.packId ?? "");
  if (!pack) {
    return NextResponse.json({ error: "유효하지 않은 캔들 팩입니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: purchase, error } = await admin
    .from("candle_purchases")
    .insert({
      user_id: userId,
      candles: pack.candles,
      price_krw: pack.price_krw,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !purchase) {
    return NextResponse.json({ error: "구매 기록 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: purchase.id,          // Toss orderId = candle_purchases.id (UUID)
    orderName: `캔들 ${pack.candles}개`,
    amount: pack.price_krw,
    candles: pack.candles,
  });
}
