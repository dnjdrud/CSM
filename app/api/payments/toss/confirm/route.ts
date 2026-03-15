import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { confirmTossPayment } from "@/lib/toss";

/**
 * POST /api/payments/toss/confirm
 * Toss Payments 결제 승인 및 캔들 지급.
 * 결제 성공 리다이렉트 페이지에서 호출됩니다.
 */
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as {
    paymentKey?: string;
    orderId?: string;
    amount?: number;
  };

  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // 주문 record 확인 (orderId = candle_purchases.id)
  const { data: purchase } = await admin
    .from("candle_purchases")
    .select("id, user_id, candles, price_krw, status")
    .eq("id", orderId)
    .eq("status", "pending")
    .single();

  if (!purchase) {
    return NextResponse.json({ error: "유효하지 않은 주문입니다." }, { status: 400 });
  }

  // 요청한 유저가 구매자인지 확인
  if (purchase.user_id !== userId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 금액 검증
  if (purchase.price_krw !== amount) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  // Toss 결제 승인
  const result = await confirmTossPayment({ paymentKey, orderId, amount });

  if (!result.success) {
    await admin
      .from("candle_purchases")
      .update({ status: "failed" })
      .eq("id", orderId);

    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: 400 }
    );
  }

  // 구매 완료 처리
  await admin
    .from("candle_purchases")
    .update({
      status: "completed",
      stripe_session_id: paymentKey, // 기존 컬럼 재활용 (toss paymentKey 저장)
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // 캔들 잔액 증가
  const { data: user } = await admin
    .from("users")
    .select("candle_balance")
    .eq("id", userId)
    .single();

  const currentBalance = user?.candle_balance ?? 0;
  const newBalance = currentBalance + purchase.candles;

  await admin.from("users").update({ candle_balance: newBalance }).eq("id", userId);

  // 거래 내역 기록
  await admin.from("candle_transactions").insert({
    user_id: userId,
    delta: purchase.candles,
    balance_after: newBalance,
    kind: "purchase",
    ref_id: orderId,
    note: `캔들 ${purchase.candles}개 구매`,
  });

  return NextResponse.json({ ok: true, newBalance, candles: purchase.candles });
}
