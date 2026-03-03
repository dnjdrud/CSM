"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleMuteAction, toggleBlockAction } from "../actions";

export function UserActionsMenu({
  targetUserId,
  targetUserName,
  isMuted,
  isBlocked,
}: {
  targetUserId: string;
  targetUserName: string;
  isMuted: boolean;
  isBlocked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleMute() {
    if (pending) return;
    setPending(true);
    await toggleMuteAction(targetUserId);
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  async function handleBlock() {
    if (pending) return;
    setPending(true);
    await toggleBlockAction(targetUserId);
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded transition-colors duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:bg-gray-200/80"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User actions"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleMute}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-inset disabled:opacity-50"
            >
              {isMuted ? "Unmute user" : "Mute user"}
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-inset disabled:opacity-50"
            >
              {isBlocked ? "Unblock user" : "Block user"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
