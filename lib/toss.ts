/**
 * Toss Payments 서버 사이드 헬퍼
 * - 결제 승인: /v1/payments/confirm
 * 환경변수: TOSS_SECRET_KEY (test_sk_... 또는 live_sk_...)
 */

const TOSS_API = "https://api.tosspayments.com/v1/payments";

type TossConfirmResult =
  | { success: true; paymentKey: string; orderId: string; totalAmount: number }
  | { success: false; code: string; message: string };

export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return { success: false, code: "CONFIG_ERROR", message: "TOSS_SECRET_KEY is not set" };
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch(`${TOSS_API}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return {
      success: false,
      code: String(json.code ?? "UNKNOWN"),
      message: String(json.message ?? "결제 승인에 실패했습니다."),
    };
  }

  return {
    success: true,
    paymentKey: String(json.paymentKey),
    orderId: String(json.orderId),
    totalAmount: Number(json.totalAmount),
  };
}
