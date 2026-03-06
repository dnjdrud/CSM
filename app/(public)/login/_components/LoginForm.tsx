"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/** Login magic link is sent via Resend (POST /api/auth/magic-link), not Supabase Auth. */
export function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
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
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-8 space-y-4">
        <p className="text-[15px] text-gray-600 leading-relaxed">
          We sent a sign-in link to <strong className="font-medium text-gray-800">{email.trim()}</strong>. Click the link in that email to continue. It may take a minute to arrive.
        </p>
        <p className="text-sm text-gray-500">
          You can close this tab after you’ve signed in. If you don’t see the email, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {message === "account_created" && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800" role="status">
          Account created. Please sign in.
        </p>
      )}
      {message === "profile_missing" && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800" role="status">
          Please complete your profile to continue.
        </p>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            autoComplete="email"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-50 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {pending ? "Sending…" : "Send sign-in link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don’t have an account?{" "}
        <Link href="/request-access" className="font-medium text-gray-700 underline hover:text-gray-900">
          Request access
        </Link>
      </p>
    </div>
  );
}
