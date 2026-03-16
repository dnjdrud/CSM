"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNoteAction } from "../actions";
import { useToast } from "@/components/ui/Toast";
import type { NoteType } from "@/lib/domain/types";

const GRATITUDE_MAX_LENGTH = 500;

type Props = {
  type: NoteType;
  disabled?: boolean;
  placeholder?: string;
};

export function NoteComposer({ type, disabled, placeholder }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const isGratitude = type === "GRATITUDE";
  const isPrayer = type === "PRAYER";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending || disabled) return;
    if (isGratitude && trimmed.length > GRATITUDE_MAX_LENGTH) return;
    setPending(true);
    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5)
      : undefined;
    const result = await createNoteAction(type, trimmed, title.trim() || undefined, tags);
    setPending(false);
    if (result.ok) {
      setContent("");
      setTitle("");
      setTagsInput("");
      router.refresh();
      toast.show("Saved.");
    } else {
      toast.error();
    }
  }

  if (type === "MEDITATION") return null;

  const inputCls = "block w-full rounded-md border border-theme-border bg-theme-surface-2/80 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:bg-theme-surface focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="border-b border-theme-border bg-theme-surface px-4 py-3">
      {isPrayer && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className={`${inputCls} mb-2`}
          disabled={pending}
        />
      )}
      {isGratitude && (
        <>
          {showTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className={`${inputCls} mb-2`}
              disabled={pending}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTitle(true)}
              className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded mb-2 transition-colors"
            >
              + Add title (optional)
            </button>
          )}
        </>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          placeholder ??
          (isGratitude ? "Name one thing you're thankful for today…" : "Write a prayer note…")
        }
        rows={isGratitude ? 2 : 3}
        maxLength={isGratitude ? GRATITUDE_MAX_LENGTH : undefined}
        className={`${inputCls} resize-none`}
        disabled={pending}
        required
      />
      {isGratitude && (
        <p className="mt-1 text-[12px] text-theme-muted">
          {content.length}/{GRATITUDE_MAX_LENGTH}
        </p>
      )}
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="Tags (optional, comma-separated, max 5)"
        className="mt-2 block w-full rounded-md border border-theme-border bg-theme-surface px-3 py-1.5 text-[13px] text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-colors"
        disabled={pending}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || pending || disabled || (isGratitude && content.length > GRATITUDE_MAX_LENGTH)}
          className="rounded-button bg-theme-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-theme-primary-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}
