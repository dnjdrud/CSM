"use client";

import { useId, useState } from "react";

export function AdminLoginForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const id = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !value) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: value }),
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        // Full document load on purpose: starts the new session with no client router cache.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/admin");
        return;
      }
      setValue("");
      setError(
        data.error === "locked"
          ? "시도가 너무 많아 잠시 잠겼어요. 나중에 다시 시도하세요."
          : data.error === "not_configured"
            ? "관리자 자격증명이 서버에 설정되지 않았어요 (ADMIN_PASSWORD, 10자 이상)."
            : "자격증명이 올바르지 않아요.",
      );
    } catch {
      setError("서버에 연결하지 못했어요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label htmlFor={id} className="font-bold">
        관리자 비밀번호
      </label>
      <input
        id={id}
        type="password"
        autoComplete="current-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={256}
        className="h-16 w-full rounded-2xl border-2 border-line bg-surface px-4 text-text"
      />
      <div aria-live="assertive">
        {error && (
          <p role="alert" className="rounded-2xl bg-error-bg p-4 text-error">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary" disabled={sending || !value}>
        {sending ? "확인 중…" : "관리자 로그인"}
      </button>
    </form>
  );
}
