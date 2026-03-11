/**
 * /support/checkout
 * TossPayments 위젯을 띄우는 결제 페이지.
 * SupportFlowForm → POST /api/support/intents → redirect here with intentId
 */
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

type TossPayments = {
  requestPayment: (
    method: string,
    params: {
      amount: number;
      orderId: string;
      orderName: string;
      successUrl: string;
      failUrl: string;
      customerName?: string;
      flowMode?: string;
      easyPay?: string;
    }
  ) => Promise<void>;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPayments;
  }
}

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tossRef = useRef<TossPayments | null>(null);

  const intentId = params.get("intentId") ?? "";
  const amountKrw = Number(params.get("amountKrw") ?? "0");
  const orderName = params.get("orderName") ?? "후원금";

  useEffect(() => {
    if (!intentId || !amountKrw) {
      router.replace("/support");
    }
  }, [intentId, amountKrw, router]);

  const handleScriptLoad = () => {
    if (window.TossPayments && TOSS_CLIENT_KEY) {
      tossRef.current = window.TossPayments(TOSS_CLIENT_KEY);
      setReady(true);
    } else if (!TOSS_CLIENT_KEY) {
      setError("결제 키가 설정되지 않았습니다. 관리자에게 문의해 주세요.");
    }
  };

  const handlePay = async () => {
    if (!tossRef.current || !intentId || !amountKrw || paying) return;
    setPaying(true);
    setError(null);
    try {
      const origin = window.location.origin;
      await tossRef.current.requestPayment("카드", {
        amount: amountKrw,
        orderId: intentId,
        orderName,
        successUrl: `${origin}/api/support/confirm`,
        failUrl: `${origin}/support/fail`,
        flowMode: "DEFAULT",
      });
    } catch (e: unknown) {
      // 사용자가 결제창을 닫은 경우 등
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("PAY_PROCESS_CANCELED")) {
        setError("결제 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
      setPaying(false);
    }
  };

  const handleEasyPay = async (provider: "카카오페이" | "토스페이") => {
    if (!tossRef.current || !intentId || !amountKrw || paying) return;
    setPaying(true);
    setError(null);
    try {
      const origin = window.location.origin;
      await tossRef.current.requestPayment("간편결제", {
        amount: amountKrw,
        orderId: intentId,
        orderName,
        successUrl: `${origin}/api/support/confirm`,
        failUrl: `${origin}/support/fail`,
        easyPay: provider,
      });
    } catch {
      setPaying(false);
    }
  };

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1/payment"
        onLoad={handleScriptLoad}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs text-theme-muted uppercase tracking-widest">후원</p>
            <h1 className="text-2xl font-semibold text-theme-text">
              ₩{amountKrw.toLocaleString()}
            </h1>
            <p className="text-sm text-theme-muted">{orderName}</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handlePay}
              disabled={!ready || paying}
              className="w-full py-3.5 rounded-xl bg-theme-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {paying ? "결제 처리 중…" : "카드로 결제"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleEasyPay("카카오페이")}
                disabled={!ready || paying}
                className="flex-1 py-3 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                카카오페이
              </button>
              <button
                onClick={() => handleEasyPay("토스페이")}
                disabled={!ready || paying}
                className="flex-1 py-3 rounded-xl bg-[#0064FF] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                토스페이
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-theme-muted leading-relaxed">
            결제 금액은 100% 선교지에 전달됩니다.
            <br />
            플랫폼 수수료 없음.
          </p>

          <button
            onClick={() => router.back()}
            className="w-full text-sm text-theme-muted hover:text-theme-text transition-colors"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-theme-bg flex items-center justify-center"><p className="text-theme-muted text-sm">Loading…</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
