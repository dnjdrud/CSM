"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  creatorId: string;
  isActiveSubscriber: boolean;
  candlesPerMonth: number;
  initialCount?: number;
  isLoggedIn: boolean;
  userCandleBalance?: number;
};

export function PaidSubscribeButton({
  creatorId,
  isActiveSubscriber,
  candlesPerMonth,
  initialCount = 0,
  isLoggedIn,
  userCandleBalance = 0,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughCandles = userCandleBalance >= candlesPerMonth;

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/candles/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        required?: number;
        balance?: number;
      };
      if (data.ok) {
        router.refresh();
      } else if (res.status === 402) {
        setError(
          `캔들이 부족합니다. ${data.required}캔들 필요, 현재 ${data.balance}캔들 보유`
        );
      } else {
        setError(data.error ?? "구독에 실패했습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  async function handleUnsubscribe() {
    if (!confirm("구독을 취소하시겠습니까? 사용된 캔들은 환불되지 않습니다.")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/candles/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "구독 취소에 실패했습니다.");
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  if (isActiveSubscriber) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-primary/10 border border-theme-primary/30 text-theme-primary text-[13px] font-semibold">
          <span aria-hidden>✓</span> 구독 중
        </span>
        {initialCount > 0 && (
          <span className="text-[12px] text-theme-muted">
            까마귀 {initialCount.toLocaleString()}명
          </span>
        )}
        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={pending}
          className="text-[12px] text-theme-muted underline hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {pending ? "처리 중…" : "구독 취소"}
        </button>
        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={pending}
        className="flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold bg-theme-primary text-black hover:brightness-110 disabled:opacity-60 transition-all"
      >
        <span aria-hidden>🕯️</span>
        {pending ? "…" : `${candlesPerMonth}캔들 / 월 구독`}
      </button>
      {initialCount > 0 && (
        <span className="text-[12px] text-theme-muted">
          까마귀 {initialCount.toLocaleString()}명
        </span>
      )}
      {isLoggedIn && !hasEnoughCandles && (
        <p className="text-[12px] text-theme-muted">
          캔들이 부족합니다.{" "}
          <Link href="/settings/candles" className="text-theme-primary underline">
            캔들 충전하기
          </Link>
        </p>
      )}
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
