"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password || pending) return;
    setPending(true);
    setError(null);
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    window.location.href = "/feed";
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setError(null);
    const { error: err } = await supabaseBrowser().auth.signInWithOAuth({
      provider: provider === "kakao" ? "kakao" : "google",
      options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback` },
    });
    if (err) setError(err.message);
  }

  return (
    <div className="mt-8 space-y-6">
      {message === "account_created" && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800" role="status">
          Account created. Please sign in with your email and password.
        </p>
      )}
      {message === "profile_missing" && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800" role="status">
          Please complete your profile to continue.
        </p>
      )}

      <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-800">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            autoComplete="current-password"
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          className="inline-flex justify-center items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          Continue with Kakao
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don’t have an account?{" "}
        <Link href="/request-access" className="font-medium text-gray-700 underline hover:text-gray-900">
          Request access
        </Link>
      </p>
    </div>
  );
}
