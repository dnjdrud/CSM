"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { SpiritualNote } from "@/lib/data/spiritualRepository";
import type { User } from "@/lib/domain/types";
import {
  fetchFollowingUsersAction,
  shareSpiritualNoteAction,
} from "../spiritual/sharePrayerAction";

type Recipient = Pick<User, "id" | "name" | "avatarUrl" | "role">;

type Props = {
  note: SpiritualNote;
  onClose: () => void;
};

/* ─── 단계 ───────────────────────────────────────────────────── */
type Step = "pick" | "confirm" | "done";

/* ─── 컴포넌트 ───────────────────────────────────────────────── */

export function SharePrayerModal({ note, onClose }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [users, setUsers] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 팔로우 목록 로드
  useEffect(() => {
    fetchFollowingUsersAction().then((res) => {
      if ("users" in res) setUsers(res.users);
      setLoading(false);
    });
  }, []);

  // ESC 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSend() {
    if (!selected) return;
    setSending(true);
    setError(null);
    const res = await shareSpiritualNoteAction({
      noteId: note.id,
      recipientId: selected.id,
    });
    setSending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStep("done");
  }

  const typeLabel = note.type === "prayer" ? "🙏 기도 노트" : "📔 삶 기록";
  const filtered = query.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Sheet */}
      <div className="w-full sm:max-w-md bg-theme-bg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-theme-border">
          <div>
            <p className="text-[11px] font-medium text-theme-primary">
              {typeLabel}
            </p>
            <h2 className="text-[16px] font-bold text-theme-text mt-0.5">
              {step === "done" ? "공유 완료" : "공유하기"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text transition-colors p-1 rounded-lg"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* ── 기록 미리보기 ── */}
        {step !== "done" && (
          <div className="mx-5 mt-4 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 space-y-1">
            {note.title && (
              <p className="text-[13px] font-semibold text-theme-text">{note.title}</p>
            )}
            <p className="text-[13px] text-theme-muted leading-relaxed line-clamp-3">
              {note.content}
            </p>
          </div>
        )}

        {/* ── Step: pick ── */}
        {step === "pick" && (
          <div className="px-5 pb-6 mt-4 space-y-3">
            <p className="text-[13px] text-theme-muted">
              노트를 공유할 사람을 선택하세요.
            </p>

            {/* 검색 */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 검색"
              className="w-full text-[13px] border border-theme-border rounded-xl px-3 py-2 bg-theme-surface text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary"
            />

            {/* 목록 */}
            <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
              {loading && (
                <p className="text-[12px] text-theme-muted text-center py-4">
                  불러오는 중…
                </p>
              )}
              {!loading && filtered.length === 0 && (
                <p className="text-[12px] text-theme-muted text-center py-6 leading-relaxed">
                  {users.length === 0
                    ? "팔로우한 사람이 없습니다.\n팔로우한 사람에게만 공유할 수 있어요."
                    : "검색 결과가 없습니다."}
                </p>
              )}
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelected(u);
                    setStep("confirm");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-theme-surface transition-colors text-left"
                >
                  {u.avatarUrl ? (
                    <Image
                      src={u.avatarUrl}
                      alt={u.name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-theme-primary/10 text-theme-primary text-[12px] font-semibold flex items-center justify-center shrink-0">
                      {u.name.slice(0, 2)}
                    </span>
                  )}
                  <span className="text-[14px] font-medium text-theme-text truncate">
                    {u.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: confirm ── */}
        {step === "confirm" && selected && (
          <div className="px-5 pb-6 mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface px-4 py-3">
              {selected.avatarUrl ? (
                <Image
                  src={selected.avatarUrl}
                  alt={selected.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-theme-primary/10 text-theme-primary text-[12px] font-semibold flex items-center justify-center shrink-0">
                  {selected.name.slice(0, 2)}
                </span>
              )}
              <div>
                <p className="text-[13px] text-theme-muted">받는 사람</p>
                <p className="text-[14px] font-semibold text-theme-text">
                  {selected.name}
                </p>
              </div>
            </div>

                <p className="text-[12px] text-theme-muted leading-relaxed">
                  이 기록을 {selected.name}님에게 DM으로 보냅니다.
                </p>

            {error && (
              <p className="text-[12px] text-red-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setStep("pick"); setError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-theme-border text-[13px] text-theme-muted hover:text-theme-text transition-colors"
              >
                다시 선택
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl bg-theme-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {sending ? "보내는 중…" : "노트 보내기 🙏"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === "done" && (
          <div className="px-5 pb-8 mt-4 text-center space-y-3">
            <span className="text-5xl block" aria-hidden>🕊️</span>
            <p className="text-[15px] font-semibold text-theme-text">
              노트를 보냈습니다
            </p>
            <p className="text-[13px] text-theme-muted leading-relaxed">
              {selected?.name}님과 이 내용을 함께 나눴습니다.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl border border-theme-border text-[13px] text-theme-muted hover:text-theme-text transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
