"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { submitSetPasswordAction } from "./actions";

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const valid = id && token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setStatus("loading");
    const result = await submitSetPasswordAction({ id, token, password });
    if ("ok" in result && result.ok) {
      setStatus("success");
      setMessage("Password updated. You can sign in now.");
    } else {
      setStatus("error");
      setMessage("error" in result ? result.error : "Failed to set password.");
    }
  }

  if (!valid) {
    return (
      <>
        <p className="text-theme-muted">Invalid or missing reset link. Request a new password reset.</p>
        <Link href="/login" className="mt-4 text-theme-primary hover:underline">Back to login</Link>
      </>
    );
  }

  return status === "success" ? (
    <div className="space-y-2 text-center">
      <p className="text-theme-text">{message}</p>
      <Link href="/login" className="text-theme-primary hover:underline">Sign in</Link>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-theme-text mb-1">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-theme-text mb-1">Confirm password</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text"
          required
        />
      </div>
      {message && <p className={status === "error" ? "text-red-500 text-sm" : "text-theme-muted text-sm"}>{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2 px-4 bg-theme-primary text-white rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Updating…" : "Set password"}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-theme-bg text-theme-text">
      <h1 className="text-xl font-semibold mb-4">Set new password</h1>
      <Suspense fallback={<p className="text-theme-muted text-sm">Loading…</p>}>
        <SetPasswordForm />
      </Suspense>
      <Link href="/login" className="mt-4 text-theme-muted hover:text-theme-text text-sm">Back to login</Link>
    </div>
  );
}
