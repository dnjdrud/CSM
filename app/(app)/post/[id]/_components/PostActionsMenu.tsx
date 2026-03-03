"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostWithAuthor } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { deletePostAction as deletePostActionDefault, updatePostAction as updatePostActionDefault } from "../actions";

type DeletePostAction = (postId: string) => Promise<{ ok: boolean; error?: string }>;
type UpdatePostAction = (postId: string, content: string, category?: string, visibility?: string, tags?: string[]) => Promise<{ ok: boolean; error?: string }>;

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "PRAYER", label: CATEGORY_LABELS.PRAYER },
  { value: "DEVOTIONAL", label: CATEGORY_LABELS.DEVOTIONAL },
  { value: "MINISTRY", label: CATEGORY_LABELS.MINISTRY },
  { value: "TESTIMONY", label: CATEGORY_LABELS.TESTIMONY },
];

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "MEMBERS", label: "Members" },
  { value: "PUBLIC", label: "Public" },
  { value: "FOLLOWERS", label: "Followers" },
  { value: "PRIVATE", label: "Private" },
];

export function PostActionsMenu({
  post,
  onUpdated,
  onDeleted,
  compact = false,
  deletePostAction: deletePostActionProp,
  updatePostAction: updatePostActionProp,
}: {
  post: PostWithAuthor;
  onUpdated?: (content: string) => void;
  onDeleted?: () => void;
  compact?: boolean;
  /** When provided (e.g. from feed), use instead of route actions. */
  deletePostAction?: DeletePostAction;
  updatePostAction?: UpdatePostAction;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category);
  const [visibility, setVisibility] = useState<Visibility>(post.visibility);
  const [tagsInput, setTagsInput] = useState((post.tags ?? []).join(", "));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletePostAction = deletePostActionProp ?? deletePostActionDefault;
  const updatePostAction = updatePostActionProp ?? updatePostActionDefault;

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setPending(true);
    setError(null);
    const result = await deletePostAction(post.id);
    setPending(false);
    if (result.ok) {
      onDeleted?.();
      return;
    }
    setError(result.error ?? "Failed to delete");
  }

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    const tags = tagsInput ? tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5) : undefined;
    const result = await updatePostAction(post.id, trimmed, category, visibility, tags);
    setPending(false);
    if (result.ok) {
      onUpdated?.(trimmed);
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update");
    }
  }

  if (editing) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[15px] text-gray-900"
          disabled={pending}
        />
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-700">Category</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm">
                <input type="radio" checked={category === value} onChange={() => setCategory(value)} className="rounded-full border-gray-300" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-700">Visibility</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm">
                <input type="radio" checked={visibility === value} onChange={() => setVisibility(value)} className="rounded-full border-gray-300" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. prayer, work"
            className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !content.trim()}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null); setContent(post.content); setCategory(post.category); setVisibility(post.visibility); setTagsInput((post.tags ?? []).join(", ")); }}
            disabled={pending}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
        aria-label="Post actions"
      >
        {compact ? "⋯" : "⋮"}
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 py-1 w-36 rounded-md border border-gray-200 bg-white shadow-lg z-20">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setEditing(true); }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); handleDelete(); }}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
