"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/domain/types";
import { updateNoteAction } from "../actions";
import { useToast } from "@/components/ui/Toast";

const GRATITUDE_MAX_LENGTH = 500;

type Props = {
  note: Note;
  onClose: () => void;
  onSaved: () => void;
};

export function NoteEditorModal({ note, onClose, onSaved }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState(note.tags.join(", "));
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const isGratitude = note.type === "GRATITUDE";

  useEffect(() => {
    setTitle(note.title ?? "");
    setContent(note.content);
    setTagsInput(note.tags.join(", "));
  }, [note.id, note.title, note.content, note.tags]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending) return;
    if (isGratitude && trimmed.length > GRATITUDE_MAX_LENGTH) return;
    setPending(true);
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 5)
      : [];
    const result = await updateNoteAction(note.id, {
      title: title.trim() || undefined,
      content: trimmed,
      tags,
    });
    setPending(false);
    if (result.ok) {
      router.refresh();
      toast.show("Updated.");
      onSaved();
    } else {
      toast.error();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-editor-title"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-theme-border bg-theme-surface">
        <h2 id="note-editor-title" className="sr-only">
          Edit note
        </h2>
        <form onSubmit={handleSubmit} className="p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="block w-full rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary mb-3"
            disabled={pending}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            rows={5}
            maxLength={isGratitude ? GRATITUDE_MAX_LENGTH : undefined}
            className="block w-full resize-none rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[15px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
            disabled={pending}
            required
          />
          {isGratitude && (
            <p className="mt-1 text-[12px] text-theme-subtle">
              {content.length}/{GRATITUDE_MAX_LENGTH}
            </p>
          )}
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags (comma-separated, max 5)"
            className="mt-3 block w-full rounded-md border border-theme-border bg-theme-surface px-3 py-1.5 text-[13px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
            disabled={pending}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-theme-border px-4 py-2 text-[14px] font-medium text-theme-text hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || pending || (isGratitude && content.length > GRATITUDE_MAX_LENGTH)}
              className="rounded-lg bg-theme-primary px-4 py-2 text-[14px] font-semibold text-black hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
