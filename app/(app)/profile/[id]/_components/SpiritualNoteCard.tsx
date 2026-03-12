"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpiritualNote } from "@/lib/data/spiritualRepository";
import {
  updateSpiritualNoteAction,
  deleteSpiritualNoteAction,
} from "../spiritual/actions";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function SpiritualNoteCard({ note }: { note: SpiritualNote }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title ?? "");
  const [editContent, setEditContent] = useState(note.content);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    if (!editContent.trim()) return;
    setPending(true);
    const result = await updateSpiritualNoteAction(note.id, {
      type: note.type,
      title: editTitle.trim() || null,
      content: editContent,
    });
    setPending(false);
    if ("error" in result) return;
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setPending(true);
    await deleteSpiritualNoteAction(note.id, note.type);
    setPending(false);
    router.refresh();
  }

  async function handleToggleAnswered() {
    setPending(true);
    await updateSpiritualNoteAction(note.id, {
      type: note.type,
      isAnswered: !note.isAnswered,
    });
    setPending(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="py-4 space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="제목 (선택)"
          maxLength={100}
          className="w-full text-[14px] bg-transparent border-b border-theme-border pb-1 text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={5}
          className="w-full text-[14px] bg-theme-surface border border-theme-border rounded-lg p-3 text-theme-text focus:outline-none focus:border-theme-primary resize-none leading-relaxed"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setEditing(false);
              setEditTitle(note.title ?? "");
              setEditContent(note.content);
            }}
            className="text-[13px] text-theme-muted hover:text-theme-text px-3 py-1.5"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={pending || !editContent.trim()}
            className="text-[13px] font-semibold px-4 py-1.5 rounded-lg bg-theme-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 space-y-1.5 ${note.isAnswered ? "opacity-55" : ""}`}>
      {/* Header row: title + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          {note.title && (
            <p className="text-[14px] font-semibold text-theme-text">
              {note.title}
            </p>
          )}
          <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-theme-muted hover:text-theme-text transition-colors px-1.5 py-0.5 rounded"
          >
            수정
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[11px] text-theme-muted hover:text-red-500 transition-colors px-1.5 py-0.5 rounded"
            >
              삭제
            </button>
          ) : (
            <span className="flex items-center gap-0.5">
              <button
                onClick={handleDelete}
                disabled={pending}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5"
              >
                {pending ? "…" : "확인"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-theme-muted px-1.5 py-0.5"
              >
                취소
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Footer row: timestamp + answered badge */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-theme-muted">
          {relativeTime(note.createdAt)}
        </span>
        {note.type === "prayer" && (
          <button
            onClick={handleToggleAnswered}
            disabled={pending}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-all ${
              note.isAnswered
                ? "bg-green-100 text-green-700"
                : "bg-theme-surface-2 text-theme-muted hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {note.isAnswered ? "✓ 응답받음" : "응답 표시"}
          </button>
        )}
      </div>
    </div>
  );
}
