"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { INPUT, BTN_PRIMARY } from "@/lib/design/tokens";

/** Login magic link is sent via Resend (POST /api/auth/magic-link), not Supabase Auth. */
export function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Failed to send sign-in link.");
      return;
    }
    if (data?.notRegistered) {
      setNotRegistered(true);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-8 space-y-4">
        <p className="text-body text-theme-text-2 leading-relaxed">
          We sent a sign-in link to <strong className="font-medium text-theme-text">{email.trim()}</strong>. Click the link in that email to continue. It may take a minute to arrive.
        </p>
        <p className="text-sm text-theme-muted">
          You can close this tab after you've signed in. If you don't see the email, check your spam folder.
        </p>
      </div>
    );
  }

  if (notRegistered) {
    return (
      <div className="mt-8 rounded-xl border border-theme-warning/30 bg-theme-warning-bg p-5">
        <p className="text-sm font-medium text-theme-warning">가입 승인이 되지 않은 이메일입니다.</p>
        <p className="mt-1.5 text-sm text-theme-warning/80 leading-relaxed">
          <strong className="font-medium">{email.trim()}</strong> 으로 가입된 계정이 없습니다.
          아직 가입 신청을 하지 않으셨거나, 아직 승인 대기 중일 수 있습니다.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/request-access"
            className="inline-block rounded-button bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:bg-theme-primary-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
          >
            가입 신청하기
          </Link>
          <button
            type="button"
            onClick={() => { setNotRegistered(false); setEmail(""); }}
            className="inline-block rounded-button border border-theme-warning/40 px-4 py-2 text-sm font-medium text-theme-warning hover:bg-theme-warning/10 transition-colors focus:outline-none"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {message === "account_created" && (
        <p className="rounded-xl bg-theme-success-bg border border-theme-success/20 px-3 py-2 text-sm text-theme-success" role="status">
          Account created. Please sign in.
        </p>
      )}
      {message === "profile_missing" && (
        <p className="rounded-xl bg-theme-warning-bg border border-theme-warning/20 px-3 py-2 text-sm text-theme-warning" role="status">
          Please complete your profile to continue.
        </p>
      )}
      {urlError && (
        <p className="rounded-xl bg-theme-danger-bg border border-theme-danger/20 px-3 py-2 text-sm text-theme-danger" role="alert">
          {urlError === "invalid_or_expired"
            ? "This sign-in link has expired or already been used. Please request a new one."
            : urlError === "verify_failed" || urlError === "link_failed"
            ? "Sign-in failed. Please try again."
            : urlError === "missing_params"
            ? "Invalid sign-in link. Please request a new one."
            : "Something went wrong. Please try again."}
        </p>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-theme-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-1.5 ${INPUT}`}
            autoComplete="email"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-theme-danger" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={`w-full ${BTN_PRIMARY}`}
        >
          {pending ? "Sending…" : "Send sign-in link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-theme-muted">
        Don't have an account?{" "}
        <Link href="/request-access" className="font-medium text-theme-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
          Request access
        </Link>
      </p>
    </div>
  );
}
