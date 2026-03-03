"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import { useToast } from "@/components/ui/Toast";

const PLACEHOLDER = "Share a prayer, reflection, or testimony…";
const CONTENT_MAX_LENGTH = 10000;
const SOFT_LIMIT = 1000;

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

export type ComposePostActionParams = {
  content: string;
  category?: PostCategory;
  visibility?: Visibility;
  tags?: string[];
};

export type ComposePostAction = (params: ComposePostActionParams) => Promise<{ ok: boolean; error?: string }>;

type ComposeBoxProps = {
  composePostAction: ComposePostAction;
  defaultExpanded?: boolean;
  defaultMoreOptions?: boolean;
  redirectOnSuccess?: string;
};

export function ComposeBox({
  composePostAction,
  defaultExpanded = false,
  defaultMoreOptions = false,
  redirectOnSuccess,
}: ComposeBoxProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [category, setCategory] = useState<PostCategory>("PRAYER");
  const [visibility, setVisibility] = useState<Visibility>("MEMBERS");
  const [tagsInput, setTagsInput] = useState("");
  const [pending, setPending] = useState(false);
  const [justPosted, setJustPosted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && trimmed.length <= CONTENT_MAX_LENGTH && !pending;

  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (trimmed.length === 0) {
        setExpanded(false);
        textareaRef.current?.blur();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;
    setErrorMessage(null);
    setPending(true);
    const result = await composePostAction({
      content: trimmed,
      category,
      visibility,
      tags: tags.length ? tags : undefined,
    });
    setPending(false);
    if (result.ok) {
      setContent("");
      setJustPosted(true);
      toast.show("Posted.");
      setTimeout(() => {
        setJustPosted(false);
        setExpanded(false);
        router.refresh();
        if (redirectOnSuccess) router.push(redirectOnSuccess);
      }, 1200);
    } else {
      setErrorMessage(result.error ?? "Something went wrong. Please try again.");
    }
  }

  const showToolbar = expanded;
  const showPostButton = trimmed.length > 0 || justPosted;

  return (
    <form onSubmit={handleSubmit} className="rounded-t-xl border border-gray-200 border-b bg-white transition-[border-color] duration-200">
      <div className="px-3 sm:px-4 py-3 transition-[padding] duration-200">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setErrorMessage(null); }}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          rows={expanded ? 5 : 2}
          maxLength={CONTENT_MAX_LENGTH}
          className="block w-full resize-none rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-[15px] leading-7 text-gray-900 placeholder:text-neutral-500 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 transition-[min-height,border-color] duration-300 ease-out min-h-[4.5rem]"
          style={{ minHeight: expanded ? "10rem" : "4.5rem" }}
          aria-label="Compose post"
          aria-invalid={errorMessage != null}
          aria-describedby={errorMessage ? "compose-error" : undefined}
        />

        {showToolbar && (
          <div
            className="mt-3 space-y-3 rounded-md border border-gray-100 bg-gray-50/50 p-3 text-sm"
            role="toolbar"
            aria-label="Post options"
          >
            <div>
              <span className="text-xs font-medium text-neutral-600">Visibility</span>
              <div className="mt-1 flex flex-wrap gap-3" role="group" aria-label="Visibility">
                {VISIBILITY_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={visibility === value}
                      onChange={() => setVisibility(value)}
                      className="rounded-full border-gray-300 text-gray-700 focus:ring-gray-500"
                      aria-label={`Visibility: ${label}`}
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-600">Category</span>
              <div className="mt-1 flex flex-wrap gap-3" role="group" aria-label="Category">
                {CATEGORIES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={value}
                      checked={category === value}
                      onChange={() => setCategory(value)}
                      className="rounded-full border-gray-300 text-gray-700 focus:ring-gray-500"
                      aria-label={`Category: ${label}`}
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="compose-tags" className="text-xs font-medium text-neutral-600">
                Topics (optional, max 5)
              </label>
              <input
                id="compose-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. prayer, work"
                className="mt-1 block w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-[15px] text-gray-800 placeholder:text-neutral-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                aria-label="Topics, optional, max 5"
              />
            </div>
          </div>
        )}

        <div
          className={`mt-3 flex flex-wrap items-center gap-2 ${expanded ? "sticky bottom-0 z-10 border-t border-gray-100 bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" : ""}`}
          role="toolbar"
          aria-label="Post actions"
        >
          {showPostButton && (
            <>
              {showToolbar && !justPosted && (
                <span
                  className={`text-xs ${trimmed.length > SOFT_LIMIT ? "text-amber-600" : "text-neutral-400"}`}
                  aria-live="polite"
                >
                  {trimmed.length}
                  {trimmed.length <= SOFT_LIMIT ? ` / ${SOFT_LIMIT}` : ""}
                </span>
              )}
              <div className={`flex items-center gap-2 ${showToolbar && !justPosted ? "ml-auto" : "w-full justify-end"}`}>
                <button
                  type="submit"
                  disabled={!canPost && !justPosted}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md bg-gray-800 px-5 py-3 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:bg-gray-700 active:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:transform-none"
                  aria-label={justPosted ? "Posted" : pending ? "Posting" : "Post"}
                >
                  {justPosted ? "Posted" : pending ? "Posting…" : "Post"}
                </button>
              </div>
            </>
          )}
        </div>
        {errorMessage && (
          <p id="compose-error" className="mt-2 text-[13px] text-red-600/90" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
