"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ministry, SupportPurpose } from "@/lib/domain/types";

const PURPOSES: { value: SupportPurpose; label: string; desc: string }[] = [
  { value: "ONGOING", label: "지속 사역", desc: "정기적인 사역 운영 지원" },
  { value: "PROJECT", label: "특정 프로젝트", desc: "단기 프로젝트 또는 이벤트" },
  { value: "URGENT", label: "긴급 지원", desc: "즉각적인 도움이 필요한 상황" },
];

const PRESET_AMOUNTS = [10000, 30000, 50000, 100000];

export function SupportFlowForm({ ministry }: { ministry: Ministry }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<SupportPurpose | "">("");
  const [amountChoice, setAmountChoice] = useState<number | "custom" | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customValue = Number(customAmount.replace(/\D/g, ""));
  const resolvedAmount =
    amountChoice === "custom" ? customValue : (amountChoice ?? 0);

  const canSubmit =
    purpose !== "" &&
    amountChoice !== null &&
    resolvedAmount >= 1000;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/support/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ministryId: ministry.id,
          purpose,
          amountKrw: resolvedAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }

      const { intentId, amountKrw, orderName } = await res.json();
      const params = new URLSearchParams({
        intentId,
        amountKrw: String(amountKrw),
        orderName,
      });
      router.push(`/support/checkout?${params.toString()}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 사역 설명 */}
      <section>
        <h2 className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-3">
          사역 소개
        </h2>
        <p className="text-theme-text leading-relaxed">{ministry.description}</p>
        {ministry.location && (
          <p className="mt-1 text-sm text-theme-muted">{ministry.location}</p>
        )}
      </section>

      {/* 후원 목적 */}
      <section>
        <h2 className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-3">
          후원 목적
        </h2>
        <div className="space-y-2">
          {PURPOSES.map(({ value, label, desc }) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                purpose === value
                  ? "border-theme-primary bg-theme-primary/5"
                  : "border-theme-border hover:border-theme-primary/40"
              }`}
            >
              <input
                type="radio"
                name="purpose"
                value={value}
                checked={purpose === value}
                onChange={() => setPurpose(value)}
                className="mt-0.5 accent-theme-primary"
              />
              <span>
                <span className="block text-sm font-medium text-theme-text">{label}</span>
                <span className="block text-xs text-theme-muted mt-0.5">{desc}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* 금액 선택 */}
      <section>
        <h2 className="text-xs font-medium text-theme-muted uppercase tracking-wider mb-3">
          금액
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmountChoice(amt)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                amountChoice === amt
                  ? "border-theme-primary bg-theme-primary text-white"
                  : "border-theme-border text-theme-text hover:border-theme-primary/40"
              }`}
            >
              ₩{amt.toLocaleString()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAmountChoice("custom")}
          className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            amountChoice === "custom"
              ? "border-theme-primary bg-theme-primary/5 text-theme-primary"
              : "border-theme-border text-theme-muted hover:border-theme-primary/40"
          }`}
        >
          직접 입력
        </button>
        {amountChoice === "custom" && (
          <div className="mt-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted text-sm">₩</span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="1,000 이상 입력"
                className="w-full border border-theme-border rounded-xl pl-7 pr-4 py-2.5 text-sm text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
              />
            </div>
            {customValue > 0 && (
              <p className="mt-1 text-xs text-theme-muted pl-1">
                ₩{customValue.toLocaleString()}
                {customValue < 1000 && (
                  <span className="text-red-500 ml-2">최소 ₩1,000 이상</span>
                )}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 투명성 안내 */}
      <section className="rounded-xl border border-theme-border bg-theme-surface p-4">
        <p className="text-xs text-theme-muted leading-relaxed">
          후원금은 수수료 없이 100% 사역지에 전달됩니다.
          금액과 목표는 공개되지 않습니다. 이것은 의도적인 선택입니다.
          당신의 헌신은 당신과 이 사역, 그리고 주님 사이에 있습니다.
        </p>
      </section>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="w-full py-3.5 rounded-xl bg-theme-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "처리 중…" : "후원하기"}
      </button>
    </form>
  );
}
