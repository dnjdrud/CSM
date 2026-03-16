"use client";

import { useState } from "react";
// import { loadTossPayments } from "@tosspayments/tosspayments-sdk"; // 결제 시스템 준비 중
import { CANDLE_PACKS } from "@/lib/stripe";
import type { CandlePackId } from "@/lib/stripe";

type Transaction = {
  id: string;
  delta: number;
  balanceAfter: number;
  kind: "purchase" | "subscribe" | "refund" | "admin";
  note: string | null;
  createdAt: string;
};

const KIND_LABEL: Record<Transaction["kind"], string> = {
  purchase: "충전",
  subscribe: "구독",
  refund: "환불",
  admin: "관리자",
};

type Props = {
  balance: number;
  userId: string;
  transactions: Transaction[];
};

export function CandleShopClient({ balance, userId: _userId, transactions }: Props) {
  const [selectedPack, setSelectedPack] = useState<CandlePackId>("pack_100");

  return (
    <div className="space-y-8">
      {/* 잔액 */}
      <section className="rounded-xl border border-theme-border bg-theme-surface p-5">
        <p className="text-[13px] text-theme-muted mb-1">현재 잔액</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-theme-text">
            {balance.toLocaleString()}
          </span>
          <span className="text-[16px] text-theme-muted">캔들</span>
        </div>
        <p className="text-[12px] text-theme-muted mt-1">
          ≈ {(balance * 100).toLocaleString()}원 상당
        </p>
      </section>

      {/* 캔들 팩 선택 — 결제 시스템 준비 중 */}
      <section className="rounded-xl border border-theme-border bg-theme-surface p-5">
        <h2 className="text-[15px] font-semibold text-theme-text mb-4">캔들 충전</h2>

        <div className="grid grid-cols-2 gap-3 mb-5 opacity-40 pointer-events-none select-none">
          {CANDLE_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-4 text-center ${
                selectedPack === pack.id
                  ? "border-theme-primary bg-theme-primary/5"
                  : "border-theme-border bg-theme-surface"
              }`}
            >
              <span className="text-[22px] font-bold text-theme-text">
                {pack.candles.toLocaleString()}
              </span>
              <span className="text-[12px] text-theme-muted">캔들</span>
              <span className="text-[13px] font-semibold text-theme-primary">
                {pack.price_krw.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        {/* 결제 준비 중 안내 */}
        <div className="rounded-xl border border-dashed border-theme-border bg-theme-surface-2/30 px-5 py-6 text-center">
          <p className="text-[14px] font-medium text-theme-text mb-1">결제 시스템 준비 중</p>
          <p className="text-[13px] text-theme-muted leading-relaxed">
            캔들 충전 기능은 곧 오픈될 예정입니다.
          </p>
        </div>
      </section>

      {/* 거래 내역 */}
      {transactions.length > 0 && (
        <section className="rounded-xl border border-theme-border bg-theme-surface p-5">
          <h2 className="text-[15px] font-semibold text-theme-text mb-4">거래 내역</h2>
          <ul className="divide-y divide-theme-border/60">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-theme-text">
                    {tx.note ?? KIND_LABEL[tx.kind]}
                  </p>
                  <p className="text-[11px] text-theme-muted">
                    {new Date(tx.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-[14px] font-semibold ${
                      tx.delta > 0 ? "text-theme-success" : "text-theme-text"
                    }`}
                  >
                    {tx.delta > 0 ? "+" : ""}
                    {tx.delta.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-theme-muted">
                    잔액 {tx.balanceAfter.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 안내 */}
      <section className="rounded-xl border border-dashed border-theme-border px-5 py-5 space-y-2 text-[13px] text-theme-muted">
        <p className="font-medium text-theme-text">캔들 시스템 안내</p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed">
          <li>캔들은 플랫폼 내 가상 재화입니다 (100원 = 1캔들).</li>
          <li>캔들로 크리에이터를 30일간 구독할 수 있습니다.</li>
          <li>구독 취소 시 사용된 캔들은 환불되지 않습니다.</li>
          <li>구독자 전용 게시글에 접근할 수 있습니다.</li>
        </ul>
      </section>
    </div>
  );
}
