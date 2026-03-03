"use client";

import { useState } from "react";

type DangerZoneConfirmProps = {
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  buttonLabel?: string;
  disabled?: boolean;
};

export function DangerZoneConfirm({
  title,
  description,
  confirmText,
  onConfirm,
  buttonLabel = "Confirm",
  disabled = false,
}: DangerZoneConfirmProps) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const match = typed.trim() === confirmText;

  async function handleConfirm() {
    if (!match || pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-theme-danger/30 bg-theme-danger/5 p-4">
      <h3 className="text-sm font-semibold text-theme-danger">{title}</h3>
      <p className="mt-1 text-sm text-theme-text">{description}</p>
      <p className="mt-2 text-xs text-theme-muted">
        Type <strong className="text-theme-danger">{confirmText}</strong> to enable.
      </p>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmText}
        className="mt-2 block w-full max-w-xs rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-sm text-theme-text placeholder:text-theme-muted focus:border-theme-danger focus:outline-none focus:ring-1 focus:ring-theme-danger"
        aria-label="Confirmation text"
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!match || pending || disabled}
        className="mt-3 rounded-lg bg-theme-danger px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-danger focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "…" : buttonLabel}
      </button>
    </div>
  );
}
