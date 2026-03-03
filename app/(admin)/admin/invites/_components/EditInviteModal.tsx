"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InviteCode } from "@/lib/domain/types";
import { updateInviteAction } from "../actions";

const SITE_URL = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SITE_URL ?? "") : "";

export function getInviteMessage(code: string): string {
  const base = SITE_URL ? `${SITE_URL}/onboarding` : "/onboarding";
  return `You're invited to CSM (invite-only).\nInvite code: ${code}\nSign in here: ${base}`;
}

type Props = { invite: InviteCode; onClose: () => void };

export function EditInviteModal({ invite, onClose }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState(invite.maxUses);
  const [note, setNote] = useState(invite.note ?? "");
  const [expiresAt, setExpiresAt] = useState(
    invite.expiresAt ? new Date(invite.expiresAt).toISOString().slice(0, 16) : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await updateInviteAction(invite.id, {
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        note: note.trim() || null,
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-800">Edit invite</h3>
        <p className="mt-0.5 text-sm text-gray-500">Code: {invite.code}</p>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs text-gray-600">Max uses</span>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Expires at (optional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Note</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Who is this for?"
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-sm placeholder:text-gray-400"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
