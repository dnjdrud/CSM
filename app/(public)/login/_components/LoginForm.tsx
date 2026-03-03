"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
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
    router.replace("/feed");
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setError(null);
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const { error: err } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      return;
    }
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
            placeholder="••••••••"
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
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
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
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
        >
          Kakao
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Don’t have an account?{" "}
        <a href="/onboarding" className="font-medium text-gray-700 underline hover:text-gray-900">
          Request access
        </a>
      </p>
    </div>
  );
}
