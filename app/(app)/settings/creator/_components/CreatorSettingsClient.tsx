"use client";

import { useState } from "react";
import { updateCreatorCandlePriceAction, disableCreatorSubscriptionAction } from "../actions";

type Props = {
  candlesPerMonth: number | null;
};

export function CreatorSettingsClient({ candlesPerMonth }: Props) {
  const [candles, setCandles] = useState(String(candlesPerMonth ?? "10"));
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseInt(candles, 10);
    if (isNaN(parsed)) {
      setFeedback({ type: "error", msg: "올바른 캔들 수를 입력해주세요." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await updateCreatorCandlePriceAction(parsed);
    setSaving(false);
    if ("error" in result) {
      setFeedback({ type: "error", msg: result.error });
    } else {
      setFeedback({ type: "ok", msg: "구독 가격이 저장되었습니다." });
    }
  }

  async function handleDisable() {
    if (!confirm("유료 구독을 비활성화하시겠습니까? 현재 구독자는 만료 후 자동 해지됩니다.")) return;
    setDisabling(true);
    const result = await disableCreatorSubscriptionAction();
    setDisabling(false);
    if ("error" in result) {
      setFeedback({ type: "error", msg: result.error });
    } else {
      setFeedback({ type: "ok", msg: "유료 구독이 비활성화되었습니다." });
      setCandles("10");
    }
  }

  const krwEquivalent = isNaN(parseInt(candles)) ? 0 : parseInt(candles) * 100;

  return (
    <div className="space-y-8">
      {/* 구독 가격 설정 */}
      <section className="rounded-xl border border-theme-border bg-theme-surface p-5">
        <h2 className="text-[15px] font-semibold text-theme-text mb-1">월 구독 가격 (캔들)</h2>
        <p className="text-[13px] text-theme-muted mb-4">
          최소 5캔들 (500원)부터 설정 가능합니다. 구독자는 매월 이 캔들을 소모합니다.
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[200px]">
              <input
                type="number"
                value={candles}
                onChange={(e) => setCandles(e.target.value)}
                min={5}
                step={1}
                placeholder="10"
                className="w-full text-[15px] border border-theme-border rounded-lg pl-4 pr-16 py-2.5 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-theme-muted">
                캔들
              </span>
            </div>
            <span className="text-[13px] text-theme-muted">/ 월</span>
          </div>

          {krwEquivalent > 0 && (
            <p className="text-[12px] text-theme-muted">
              ≈ 월 {krwEquivalent.toLocaleString()}원 (100원 = 1캔들)
            </p>
          )}

          {candlesPerMonth && (
            <p className="text-[12px] text-theme-muted">
              현재: 월 {candlesPerMonth}캔들 ({(candlesPerMonth * 100).toLocaleString()}원)
            </p>
          )}

          {feedback && (
            <p
              className={`text-[13px] ${feedback.type === "ok" ? "text-green-600" : "text-red-500"}`}
              role="alert"
            >
              {feedback.msg}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-theme-primary text-white text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "저장 중…" : "가격 저장"}
            </button>

            {candlesPerMonth && (
              <button
                type="button"
                onClick={handleDisable}
                disabled={disabling}
                className="px-4 py-2.5 rounded-xl border border-theme-border text-[14px] font-medium text-theme-muted hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                {disabling ? "처리 중…" : "구독 비활성화"}
              </button>
            )}
          </div>
        </form>
      </section>

      {/* 안내 */}
      <section className="rounded-xl border border-dashed border-theme-border px-5 py-5 space-y-2 text-[13px] text-theme-muted">
        <p className="font-medium text-theme-text">크리에이터 구독 안내</p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed">
          <li>구독자는 캔들 플랫폼 화폐로 구독 요금을 지불합니다.</li>
          <li>구독 시 30일치 캔들이 즉시 차감되고 구독이 활성화됩니다.</li>
          <li>구독자는 구독자 전용 게시글을 열람할 수 있습니다.</li>
          <li>구독 취소 시 환불은 제공되지 않습니다.</li>
          <li>수익 정산 기능은 추후 추가될 예정입니다.</li>
        </ul>
      </section>
    </div>
  );
}
