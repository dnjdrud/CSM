"use client";

import { useState } from "react";
import { submitSupportAction } from "@/app/(public)/support/actions";
import type { Ministry } from "@/lib/domain/types";

const PURPOSES = [
  { value: "ongoing", label: "Ongoing ministry" },
  { value: "project", label: "Specific project" },
  { value: "urgent", label: "Urgent need" },
] as const;

const AMOUNTS = [
  { value: 10000, label: "₩10,000" },
  { value: 30000, label: "₩30,000" },
] as const;

export function SupportFlowForm({ ministry }: { ministry: Ministry }) {
  const [purpose, setPurpose] = useState<string>("");
  const [amountChoice, setAmountChoice] = useState<"10000" | "30000" | "custom" | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [pending, setPending] = useState(false);

  const customValue = customAmount.replace(/\D/g, "");
  const isValidCustom = amountChoice === "custom" ? customValue.length > 0 && Number(customValue) > 0 : true;
  const canSubmit = purpose !== "" && amountChoice !== null && (amountChoice !== "custom" || isValidCustom);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    await submitSupportAction();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* 1. Explanation */}
      <section aria-labelledby="ministry-heading">
        <h2 id="ministry-heading" className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          About this work
        </h2>
        <p className="mt-3 text-gray-800 font-sans leading-relaxed">
          {ministry.description}
        </p>
        {ministry.location && (
          <p className="mt-2 text-sm text-gray-500">{ministry.location}</p>
        )}
      </section>

      {/* 2. Support purpose */}
      <section aria-labelledby="purpose-heading">
        <h2 id="purpose-heading" className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Support purpose
        </h2>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Support purpose">
          {PURPOSES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="purpose"
                value={value}
                checked={purpose === value}
                onChange={() => setPurpose(value)}
                className="rounded-full border-gray-200 text-gray-800 focus:ring-gray-700"
              />
              <span className="text-gray-800 font-sans">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 3. Amount */}
      <section aria-labelledby="amount-heading">
        <h2 id="amount-heading" className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Amount
        </h2>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Amount">
          {AMOUNTS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="amount"
                value={value}
                checked={amountChoice === String(value)}
                onChange={() => setAmountChoice(String(value) as "10000" | "30000")}
                className="rounded-full border-gray-200 text-gray-800 focus:ring-gray-700"
              />
              <span className="text-gray-800 font-sans">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="amount"
              value="custom"
              checked={amountChoice === "custom"}
              onChange={() => setAmountChoice("custom")}
              className="rounded-full border-gray-200 text-gray-800 focus:ring-gray-700"
            />
            <span className="text-gray-800 font-sans">Custom</span>
          </label>
          {amountChoice === "custom" && (
            <div className="ml-6 mt-2">
              <label htmlFor="custom-amount" className="sr-only">
                Custom amount (won)
              </label>
              <input
                id="custom-amount"
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="Amount in won"
                className="block w-full max-w-xs rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 placeholder:text-gray-500 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
              />
              {customValue.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  ₩{Number(customValue).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Transparency notice */}
      <section className="rounded-md border border-gray-200 bg-gray-50 p-4" aria-label="Transparency notice">
        <p className="text-sm text-gray-800 font-sans leading-relaxed">
          Support given through this space is passed to the ministry. We do not take a fee. Amounts and goals are not shown publicly—this is intentional. Your support is between you, this work, and the Lord.
        </p>
      </section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
        >
          Support this work
        </button>
      </div>
    </form>
  );
}
