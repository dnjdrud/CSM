"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction as addCommentActionDefault } from "../actions";
import { searchMentionUsersAction } from "../actions";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";

type AddCommentAction = (postId: string, content: string, parentId?: string) => Promise<{ ok: boolean; error?: string }>;
type MentionUser = { id: string; name: string; username: string | null };

export function CommentForm({
  postId,
  parentId,
  onCancel,
  onSuccess,
  addCommentAction: addCommentActionProp,
}: {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void | Promise<void>;
  addCommentAction?: AddCommentAction;
}) {
  const router = useRouter();
  const t = useT();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addCommentAction = addCommentActionProp ?? addCommentActionDefault;
  const toast = useToast();

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartRef = useRef<number>(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect @mention trigger in textarea
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart ?? val.length;
    // Find the last @ before cursor that is preceded by space/newline or is at start
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@([^\s@]*)$/);
    if (match) {
      const query = match[1] ?? "";
      mentionStartRef.current = cursor - query.length - 1; // position of @
      setMentionQuery(query);
      setSelectedMentionIdx(0);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.length >= 1) {
        setMentionLoading(true);
        debounceRef.current = setTimeout(async () => {
          const results = await searchMentionUsersAction(query);
          setMentionResults(results.map((u) => ({ ...u, username: u.username ?? null })));
          setMentionLoading(false);
        }, 250);
      } else {
        setMentionResults([]);
        setMentionLoading(false);
      }
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }

  function insertMention(user: MentionUser) {
    const display = user.username ? `@${user.username}` : `@${user.name}`;
    const start = mentionStartRef.current;
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(cursor);
    const newContent = `${before}${display} ${after}`;
    setContent(newContent);
    setMentionQuery(null);
    setMentionResults([]);
    // Move cursor after inserted mention
    requestAnimationFrame(() => {
      const pos = before.length + display.length + 1;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionResults.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIdx((i) => Math.min(i + 1, mentionResults.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const user = mentionResults[selectedMentionIdx];
        if (user) {
          e.preventDefault();
          insertMention(user);
          return;
        }
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        setMentionResults([]);
        return;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setSubmitError(null);
    const result = await addCommentAction(postId, trimmed, parentId);
    setPending(false);
    if (result.ok) {
      setContent("");
      if (onSuccess) await onSuccess();
      else router.refresh();
      onCancel?.();
      toast.show(t.common.save + "됨.");
    } else {
      const msg = result.error ?? "Failed to post comment";
      setSubmitError(msg);
      if (process.env.NODE_ENV !== "production") console.warn("[CommentForm]", msg);
      toast.error();
    }
  }

  const hasContent = content.trim().length > 0;
  const showDropdown = mentionQuery !== null && (mentionResults.length > 0 || mentionLoading);

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t.comments.placeholder}
          rows={2}
          className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] leading-7 text-gray-900 placeholder:text-neutral-500 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y min-h-[4rem]"
          disabled={pending}
          aria-label={t.comments.placeholder}
        />

        {/* @mention dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-theme-surface border border-theme-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {mentionLoading && mentionResults.length === 0 && (
              <p className="px-3 py-2 text-[13px] text-theme-muted">{t.common.loading}</p>
            )}
            {mentionResults.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-theme-surface-2 transition-colors ${idx === selectedMentionIdx ? "bg-theme-surface-2" : ""}`}
              >
                <span className="w-7 h-7 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-xs font-semibold shrink-0">
                  {user.name.charAt(0)}
                </span>
                <span className="font-medium text-theme-text">{user.name}</span>
                {user.username && <span className="text-theme-muted">@{user.username}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {submitError && (
        <p className="mt-2 text-[13px] text-red-600" role="alert">
          {submitError}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={!hasContent || pending}
          className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? t.common.loading : t.comments.post}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            {t.common.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
