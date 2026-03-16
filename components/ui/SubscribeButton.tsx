"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleSubscriptionAction } from "@/app/(app)/profile/[id]/crow/actions";

type Variant =
  /** 프로필 헤더 / Crow 탭: 큰 pill + 까마귀 수 표시 */
  | "full"
  /** 콘텐츠 카드 / 인라인: 작은 텍스트 버튼 */
  | "compact";

type Props = {
  creatorId: string;
  initialIsSubscribed: boolean;
  /** 까마귀 full 버전에서만 표시 */
  initialCount?: number;
  isLoggedIn: boolean;
  variant?: Variant;
};

export function SubscribeButton({
  creatorId,
  initialIsSubscribed,
  initialCount = 0,
  isLoggedIn,
  variant = "full",
}: Props) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialIsSubscribed);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const next = !subscribed;
    // Optimistic
    setSubscribed(next);
    setCount((c) => c + (next ? 1 : -1));
    setFeedback(null);

    setPending(true);
    const res = await toggleSubscriptionAction(creatorId);
    setPending(false);

    if ("error" in res) {
      // Rollback
      setSubscribed(!next);
      setCount((c) => c + (next ? -1 : 1));
      return;
    }

    const isNowSubscribed = res.result === "subscribed";
    // Correct count if server disagrees
    if (isNowSubscribed !== next) {
      setSubscribed(isNowSubscribed);
      setCount((c) => c + (isNowSubscribed ? 1 : -1));
    }

    if (isNowSubscribed) {
      setFeedback("이제 이 사역을 함께 지지하는 까마귀가 되었습니다 🐦");
      setTimeout(() => setFeedback(null), 3500);
    }

    router.refresh();
  }

  /* ── Compact (카드 내 인라인) ── */
  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        aria-label={subscribed ? "구독 취소" : "까마귀 되기"}
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all disabled:opacity-50 ${
          subscribed
            ? "border-theme-border text-theme-muted bg-theme-surface hover:border-theme-danger/30 hover:text-theme-danger"
            : "border-theme-primary/30 text-theme-primary bg-theme-primary/5 hover:bg-theme-primary/10"
        }`}
      >
        🐦{" "}
        {pending ? "…" : subscribed ? "까마귀 중" : "까마귀 되기"}
      </button>
    );
  }

  /* ── Full (프로필 헤더 / Crow 탭) ── */
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold transition-all disabled:opacity-60 ${
          subscribed
            ? "bg-theme-surface-2 border border-theme-border text-theme-muted hover:border-theme-danger/30 hover:text-theme-danger"
            : "bg-theme-primary text-white hover:opacity-90"
        }`}
      >
        <span aria-hidden>🐦</span>
        {pending ? "…" : subscribed ? "까마귀 중" : "까마귀 되기"}
      </button>

      {count > 0 && (
        <span className="text-[12px] text-theme-muted">
          까마귀 {count.toLocaleString()}명
        </span>
      )}

      {/* 구독 완료 피드백 메시지 */}
      {feedback && (
        <p className="text-[12px] text-theme-primary animate-fade-in text-center max-w-[200px] leading-relaxed">
          {feedback}
        </p>
      )}
    </div>
  );
}
