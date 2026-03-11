"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_DISPLAY } from "@/lib/domain/types";

type Props = {
  type: "PRAYED" | "WITH_YOU";
  users: User[];
  loading: boolean;
  onClose: () => void;
};

const LABELS: Record<Props["type"], string> = {
  PRAYED: "🙏 Prayed",
  WITH_YOU: "🤍 With you",
};

export function ReactorsModal({ type, users, loading, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal
      aria-label={LABELS[type]}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-gray-900">{LABELS[type]}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" aria-hidden />
            </div>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-gray-400">아직 아무도 없어요.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {users.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/profile/${user.id}`} onClick={onClose} className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded-full">
                    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${user.id}`}
                      onClick={onClose}
                      className="block text-[13px] font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 rounded"
                    >
                      {user.name}
                    </Link>
                    <p className="text-[11px] text-gray-400 truncate">
                      {ROLE_DISPLAY[user.role]}
                      {user.affiliation ? ` · ${user.affiliation}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
