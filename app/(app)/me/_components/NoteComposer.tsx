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
  /** Optional placeholder for the main textarea (e.g. daily prompt). */
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending || disabled) return;
    if (isGratitude && trimmed.length > GRATITUDE_MAX_LENGTH) return;
    setPending(true);
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 5)
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

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-200 bg-white px-4 py-3">
      {isPrayer && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="block w-full rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
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
              className="block w-full rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
              disabled={pending}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTitle(true)}
              className="text-[13px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-2"
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
        className="block w-full resize-none rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        disabled={pending}
        required
      />
      {isGratitude && (
        <p className="mt-1 text-[12px] text-gray-500">
          {content.length}/{GRATITUDE_MAX_LENGTH}
        </p>
      )}
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="Tags (optional, comma-separated, max 5)"
        className="mt-2 block w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        disabled={pending}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || pending || disabled || (isGratitude && content.length > GRATITUDE_MAX_LENGTH)}
          className="rounded-md bg-gray-800 px-4 py-2 text-[14px] font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}
