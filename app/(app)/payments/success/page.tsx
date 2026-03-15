"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TossSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [candles, setCandles] = useState(0);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amountStr = searchParams.get("amount");

    if (!paymentKey || !orderId || !amountStr) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    fetch("/api/payments/toss/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amountStr),
      }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; error?: string; candles?: number; newBalance?: number }) => {
        if (data.ok) {
          setStatus("success");
          setCandles(data.candles ?? 0);
          setTimeout(() => router.replace("/settings/candles?purchased=true"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "결제 승인에 실패했습니다.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("서버 오류가 발생했습니다.");
      });
  }, [router, searchParams]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-theme-text">
        <div className="w-10 h-10 border-4 border-theme-primary/30 border-t-theme-primary rounded-full animate-spin" />
        <p className="text-[15px]">결제 승인 처리 중입니다…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-5xl">🕯️</span>
        <p className="text-[18px] font-bold text-theme-text">
          캔들 {candles}개 충전 완료!
        </p>
        <p className="text-[14px] text-theme-muted">잠시 후 캔들 페이지로 이동합니다…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="text-5xl">❌</span>
      <p className="text-[17px] font-semibold text-red-600">결제 승인 실패</p>
      <p className="text-[14px] text-theme-muted">{message}</p>
      <button
        onClick={() => router.replace("/settings/candles")}
        className="mt-2 px-5 py-2.5 rounded-xl bg-theme-primary text-white text-[14px] font-semibold hover:opacity-90"
      >
        돌아가기
      </button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <Suspense>
        <TossSuccessContent />
      </Suspense>
    </div>
  );
}
