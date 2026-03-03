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
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
      <h3 className="text-sm font-semibold text-red-800">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{description}</p>
      <p className="mt-2 text-xs text-red-600">
        Type <strong>{confirmText}</strong> to enable.
      </p>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmText}
        className="mt-2 block w-full max-w-xs rounded border border-red-200 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        aria-label="Confirmation text"
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!match || pending || disabled}
        className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "…" : buttonLabel}
      </button>
    </div>
  );
}
