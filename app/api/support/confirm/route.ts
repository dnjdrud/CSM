/**
 * GET /api/support/confirm
 * Toss Payments 결제 성공 후 리다이렉트 핸들러.
 * ?paymentKey=...&orderId=...&amount=...
 *
 * 1. Toss API로 결제 확인 (승인)
 * 2. DB 업데이트 (intent COMPLETED, transaction 생성)
 * 3. 성공/실패 페이지로 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { completeSupportIntent, failSupportIntent, getSupportIntent } from "@/lib/data/repository";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";
const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountStr = searchParams.get("amount");

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  // 파라미터 검증
  if (!paymentKey || !orderId || !amountStr) {
    return NextResponse.redirect(`${base}/support/fail?reason=missing_params`);
  }

  const amount = Number(amountStr);
  if (!amount || isNaN(amount)) {
    return NextResponse.redirect(`${base}/support/fail?reason=invalid_amount`);
  }

  // orderId = intentId
  const intent = await getSupportIntent(orderId);
  if (!intent) {
    return NextResponse.redirect(`${base}/support/fail?reason=intent_not_found`);
  }

  // 이미 처리된 경우
  if (intent.status === "COMPLETED") {
    return NextResponse.redirect(`${base}/support/success?intentId=${orderId}`);
  }

  // 금액 위변조 방지
  if (intent.amountKrw !== amount) {
    await failSupportIntent(orderId);
    return NextResponse.redirect(`${base}/support/fail?reason=amount_mismatch`);
  }

  try {
    // Toss 결제 승인 API 호출
    const authHeader = `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`;
    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error("[support/confirm] Toss error:", tossData);
      await failSupportIntent(orderId);
      const code = tossData?.code ?? "TOSS_ERROR";
      return NextResponse.redirect(`${base}/support/fail?reason=${encodeURIComponent(code)}`);
    }

    // DB 업데이트
    await completeSupportIntent(orderId, {
      providerPaymentId: paymentKey,
      providerOrderId: orderId,
      amountKrw: amount,
      status: tossData.status ?? "DONE",
      rawResponse: tossData,
    });

    return NextResponse.redirect(`${base}/support/success?intentId=${orderId}`);
  } catch (e) {
    console.error("[support/confirm] unexpected error:", e);
    await failSupportIntent(orderId);
    return NextResponse.redirect(`${base}/support/fail?reason=server_error`);
  }
}
