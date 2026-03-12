"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpiritualNoteType } from "@/lib/data/spiritualRepository";
import { createSpiritualNoteAction } from "../spiritual/actions";

export function SpiritualNoteComposer({ type }: { type: SpiritualNoteType }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createSpiritualNoteAction({
      type,
      title: title.trim() || null,
      content,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setTitle("");
    setContent("");
    setOpen(false);
    router.refresh();
  }

  const placeholder =
    type === "prayer"
      ? "오늘의 기도제목을 기록해보세요..."
      : "오늘의 묵상, 감사, 고민을 자유롭게 적어보세요...";
  const btnLabel = type === "prayer" ? "+ 기도제목 추가" : "+ 기록 추가";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-theme-border text-[13px] text-theme-muted hover:border-theme-primary/50 hover:text-theme-primary transition-all"
      >
        {btnLabel}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-theme-primary/30 bg-theme-surface p-4 space-y-3"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택)"
        maxLength={100}
        className="w-full text-[14px] bg-transparent border-b border-theme-border pb-1.5 text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        required
        className="w-full text-[14px] bg-transparent text-theme-text placeholder:text-theme-muted focus:outline-none resize-none leading-relaxed"
      />
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-[13px] text-theme-muted hover:text-theme-text px-3 py-1.5"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="text-[13px] font-semibold px-4 py-1.5 rounded-lg bg-theme-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
