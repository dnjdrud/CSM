/**
 * POST /api/support/webhook
 * Toss Payments 웹훅 핸들러 (비동기 이벤트).
 * Toss 대시보드에서 이 URL을 웹훅 엔드포인트로 등록.
 *
 * 지원 이벤트: PAYMENT_STATUS_CHANGED
 * 웹훅 시크릿 검증: Toss-Signature 헤더 (HMAC-SHA256)
 */
import { NextRequest, NextResponse } from "next/server";
import { completeSupportIntent, failSupportIntent } from "@/lib/data/repository";

const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET ?? "";

async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // dev: skip if not configured
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = Buffer.from(sig).toString("base64");
    return computed === signature;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("Toss-Signature") ?? "";

  if (!(await verifySignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 결제 상태 변경 이벤트
  if (event.eventType === "PAYMENT_STATUS_CHANGED") {
    const data = event.data as Record<string, unknown> | undefined;
    const orderId = data?.orderId as string | undefined;
    const status = data?.status as string | undefined;
    const paymentKey = data?.paymentKey as string | undefined;
    const amount = data?.totalAmount as number | undefined;

    if (orderId && status) {
      if (status === "DONE" && paymentKey && amount) {
        await completeSupportIntent(orderId, {
          providerPaymentId: paymentKey,
          providerOrderId: orderId,
          amountKrw: amount,
          status: "DONE",
          rawResponse: data ?? {},
        });
      } else if (status === "CANCELED" || status === "ABORTED") {
        await failSupportIntent(orderId);
      }
    }
  }

  // Toss는 200 응답을 받아야 재시도하지 않음
  return NextResponse.json({ received: true });
}
