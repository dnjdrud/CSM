"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction as addCommentActionDefault } from "../actions";
import { useToast } from "@/components/ui/Toast";

type AddCommentAction = (postId: string, content: string, parentId?: string) => Promise<{ ok: boolean; error?: string }>;

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
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addCommentAction = addCommentActionProp ?? addCommentActionDefault;
  const toast = useToast();

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
      toast.show("Saved.");
    } else {
      const msg = result.error ?? "Failed to post comment";
      setSubmitError(msg);
      if (process.env.NODE_ENV !== "production") console.warn("[CommentForm]", msg);
      toast.error();
    }
  }

  const hasContent = content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment…"
        rows={2}
        className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] leading-7 text-gray-900 placeholder:text-neutral-500 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y min-h-[4rem]"
        disabled={pending}
        aria-label="Comment content"
      />
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
          aria-label={pending ? "Posting comment" : "Post comment"}
        >
          {pending ? "Posting…" : "Post"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
