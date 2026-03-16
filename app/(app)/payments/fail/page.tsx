"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function TossFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="text-5xl">❌</span>
      <p className="text-[17px] font-semibold text-theme-danger">결제 실패</p>
      <p className="text-[14px] text-theme-muted">{message}</p>
      {code && (
        <p className="text-[12px] text-theme-muted opacity-60">오류 코드: {code}</p>
      )}
      <button
        onClick={() => router.replace("/settings/candles")}
        className="mt-2 px-5 py-2.5 rounded-xl bg-theme-primary text-white text-[14px] font-semibold hover:opacity-90"
      >
        다시 시도하기
      </button>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <Suspense>
        <TossFailContent />
      </Suspense>
    </div>
  );
}
