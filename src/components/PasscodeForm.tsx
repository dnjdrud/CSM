"use client";

import { useId, useRef, useState } from "react";
import type { ParentRole } from "@/lib/roles";

/**
 * Numeric password entry with an on-screen keypad. The value is masked,
 * never logged, never stored in the browser, and only sent to /api/auth/login.
 * The role sent here is only a hint for which password to compare against;
 * the server decides the account.
 */

const MAX_DIGITS = 12;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string };

function messageFor(data: { error?: string; remaining?: number; retryAfterSeconds?: number }): string {
  switch (data.error) {
    case "wrong": {
      const r = data.remaining ?? 0;
      return r <= 3
        ? `비밀번호가 맞지 않아요. 다시 한 번 눌러주세요. 앞으로 ${r}번 더 틀리면 잠시 기다리셔야 해요.`
        : "비밀번호가 맞지 않아요. 다시 한 번 눌러주세요.";
    }
    case "locked": {
      const min = Math.max(1, Math.ceil((data.retryAfterSeconds ?? 60) / 60));
      return `여러 번 맞지 않아서 잠시 멈췄어요. 약 ${min}분 뒤에 다시 해주세요.`;
    }
    case "not_configured":
      return "아직 비밀번호가 설정되지 않았어요. 아들에게 알려주세요.";
    default:
      return "입력을 확인하지 못했어요. 다시 한 번 눌러주세요.";
  }
}

export function PasscodeForm({ role }: { role: ParentRole }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const helpId = useId();
  const msgId = useId();
  const sending = status.kind === "sending";

  function update(next: string) {
    setValue(next.replace(/\D/g, "").slice(0, MAX_DIGITS));
    if (status.kind === "error") setStatus({ kind: "idle" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (value.length === 0) {
      setStatus({ kind: "error", message: "비밀번호 숫자를 먼저 눌러주세요." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, password: value }),
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && typeof data.next === "string" && data.next.startsWith("/")) {
        setValue("");
        // Full document load on purpose: starts the new session with no client router cache.
        window.location.assign(data.next);
        return;
      }
      setValue("");
      setStatus({ kind: "error", message: messageFor(data) });
      inputRef.current?.focus();
    } catch {
      setStatus({ kind: "error", message: "연결이 잠시 원활하지 않아요. 잠시 뒤 다시 눌러주세요." });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col" noValidate>
      <label htmlFor={inputId} className="mb-2 block font-bold">
        비밀번호 숫자
      </label>
      <p id={helpId} className="mb-3 text-muted">
        아래 숫자 버튼을 누르거나 직접 입력해 주세요.
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={MAX_DIGITS}
        value={value}
        onChange={(e) => update(e.target.value)}
        aria-describedby={`${helpId} ${msgId}`}
        aria-invalid={status.kind === "error"}
        disabled={sending}
        className="mb-2 h-16 w-full rounded-2xl border-2 border-line bg-surface px-4 text-center text-3xl tracking-[0.5em] text-text"
      />
      <p className="mb-4 text-muted" aria-live="polite">
        {value.length > 0 ? `${value.length}자리 입력했어요` : "아직 입력하지 않았어요"}
      </p>

      <div id={msgId} aria-live="assertive" className="mb-4 min-h-0">
        {status.kind === "error" && (
          <p role="alert" className="rounded-2xl bg-error-bg p-4 text-error">
            {status.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3" role="group" aria-label="숫자 키패드">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className="btn btn-secondary text-2xl"
            onClick={() => update(value + k)}
            disabled={sending}
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-secondary text-lg"
          onClick={() => update("")}
          disabled={sending || value.length === 0}
          aria-label="입력 모두 지우기"
        >
          모두 지우기
        </button>
        <button
          type="button"
          className="btn btn-secondary text-2xl"
          onClick={() => update(value + "0")}
          disabled={sending}
        >
          0
        </button>
        <button
          type="button"
          className="btn btn-secondary text-lg"
          onClick={() => update(value.slice(0, -1))}
          disabled={sending || value.length === 0}
          aria-label="한 자리 지우기"
        >
          하나 지우기
        </button>
      </div>

      <div className="mt-6">
        <button type="submit" className="btn btn-primary" disabled={sending} aria-busy={sending}>
          {sending ? "확인하고 있어요…" : "들어가기"}
        </button>
      </div>
    </form>
  );
}
