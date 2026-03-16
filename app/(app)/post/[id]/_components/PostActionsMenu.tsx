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
  deletePostAction?: DeletePostAction;
  updatePostAction?: UpdatePostAction;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category);
  // 기존 데이터에 visibility === \"MEMBERS\" 가 있을 수 있으므로, UI 에서는 PUBLIC 으로 보여준다.
  const [visibility, setVisibility] = useState<Visibility>(
    post.visibility === "MEMBERS" ? "PUBLIC" : post.visibility
  );
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
      <div className="mt-4 p-4 border border-theme-border rounded-xl bg-theme-surface-2/50">
        <label className="block text-sm font-medium text-theme-text mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="block w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-[15px] text-theme-text focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
          disabled={pending}
        />
        <div className="mt-3">
          <span className="text-sm font-medium text-theme-text">Category</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm text-theme-text cursor-pointer">
                <input type="radio" checked={category === value} onChange={() => setCategory(value)} className="rounded-full border-theme-border" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <span className="text-sm font-medium text-theme-text">Visibility</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm text-theme-text cursor-pointer">
                <input type="radio" checked={visibility === value} onChange={() => setVisibility(value)} className="rounded-full border-theme-border" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-theme-text">Tags (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. prayer, work"
            className="mt-1 block w-full rounded border border-theme-border bg-theme-surface-2 px-3 py-2 text-sm text-theme-text focus:border-theme-primary focus:outline-none"
          />
        </div>
        {error && <p className="mt-2 text-sm text-theme-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !content.trim()}
            className="rounded-button bg-theme-primary px-4 py-2 text-sm font-medium text-white hover:bg-theme-primary-2 transition-colors disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null); setContent(post.content); setCategory(post.category); setVisibility(post.visibility); setTagsInput((post.tags ?? []).join(", ")); }}
            disabled={pending}
            className="rounded-button border border-theme-border px-4 py-2 text-sm font-medium text-theme-muted hover:bg-theme-surface-2 transition-colors"
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
        className="p-1 rounded hover:bg-theme-surface-2 text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent transition-colors"
        aria-label="Post actions"
      >
        {compact ? "⋯" : "⋮"}
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 py-1 w-36 rounded-xl border border-theme-border bg-theme-surface shadow-md z-20">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setEditing(true); }}
              className="block w-full text-left px-3 py-2 text-sm text-theme-text hover:bg-theme-surface-2 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); handleDelete(); }}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-theme-danger hover:bg-theme-danger-bg transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
