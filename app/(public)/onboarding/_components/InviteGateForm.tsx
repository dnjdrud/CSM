"use client";

import Link from "next/link";
import { useState } from "react";
import { validateInviteCodeForGate } from "../actions";
import type { InviteValidationOutcome } from "@/lib/domain/types";

const MIN_CODE_LENGTH = 6;

const OUTCOME_MESSAGES: Record<Exclude<InviteValidationOutcome, "VALID">, string> = {
  INVALID: "That invite code doesn't look right.",
  EXPIRED: "This invite has expired. Please request a new one.",
  USED: "This invite has already been used.",
  RATE_LIMITED: "Too many attempts. Please try again in a minute.",
};

type Props = {
  onContinue: (inviteCode: string) => void;
};

export function InviteGateForm({ onContinue }: Props) {
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState(false);
  const [errorOutcome, setErrorOutcome] = useState<Exclude<InviteValidationOutcome, "VALID"> | null>(null);

  const trimmed = inviteCode.trim();
  const canSubmit = trimmed.length >= MIN_CODE_LENGTH && !pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorOutcome(null);
    setPending(true);
    const { outcome } = await validateInviteCodeForGate(trimmed);
    setPending(false);
    if (outcome === "VALID") {
      onContinue(trimmed);
      return;
    }
    setErrorOutcome(outcome);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-serif font-normal text-gray-800 tracking-tight">
          You’re invited
        </h1>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          Someone invited you to join. Enter your code to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <label htmlFor="invite-code" className="block text-sm font-medium text-gray-800">
            Invite code
          </label>
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setErrorOutcome(null);
            }}
            placeholder="Paste your code here"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors duration-150"
            autoComplete="off"
            disabled={pending}
          />
          {errorOutcome && (
            <div className="mt-3" role="alert">
              <p className="text-sm text-red-600/90">
                {OUTCOME_MESSAGES[errorOutcome]}
              </p>
              <p className="mt-3">
                <Link
                  href="/contact"
                  className="text-sm font-medium text-gray-700 underline hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
                >
                  Request an invite
                </Link>
              </p>
            </div>
          )}
          <div className="mt-6">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Checking…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
