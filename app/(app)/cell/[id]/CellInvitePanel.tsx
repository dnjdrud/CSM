"use client";

import { useEffect, useRef, useState } from "react";

interface Candidate {
  id: string;
  name: string;
  alreadyMember: boolean;
}

export function CellInvitePanel({ cellId }: { cellId: string }) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cell/${cellId}/members`);
      if (res.ok) setCandidates(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchCandidates();
  };

  const handleInvite = async (targetUserId: string) => {
    setInviting(targetUserId);
    try {
      const res = await fetch(`/api/cell/${cellId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        setInvited((prev) => new Set(prev).add(targetUserId));
      }
    } finally {
      setInviting(null);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="px-3 py-1.5 text-sm border border-theme-border rounded-lg text-theme-text hover:bg-theme-surface transition-colors"
      >
        멤버 초대
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30" />

          {/* Bottom sheet */}
          <div
            ref={panelRef}
            className="fixed inset-x-0 bottom-0 z-50 bg-theme-bg rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
              <h2 className="font-semibold text-theme-text">팔로잉 중인 멤버 초대</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-theme-muted text-xl leading-none"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-2">
              {loading && (
                <p className="text-center text-theme-muted text-sm py-8">불러오는 중…</p>
              )}
              {!loading && candidates.length === 0 && (
                <p className="text-center text-theme-muted text-sm py-8">
                  팔로잉 중인 사람이 없습니다.
                </p>
              )}
              <ul className="space-y-1">
                {candidates.map((c) => {
                  const done = c.alreadyMember || invited.has(c.id);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <span className="text-sm text-theme-text font-medium">{c.name}</span>
                      <button
                        onClick={() => !done && handleInvite(c.id)}
                        disabled={done || inviting === c.id}
                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                          done
                            ? "bg-theme-surface text-theme-muted cursor-default"
                            : "bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
                        }`}
                      >
                        {inviting === c.id
                          ? "초대 중…"
                          : done
                          ? "참여 중"
                          : "초대"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
