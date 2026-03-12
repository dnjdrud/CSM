"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import { useToast } from "@/components/ui/Toast";

const PLACEHOLDER = "기도, 묵상, 혹은 조용한 나눔을 적어보세요…";
const CONTENT_MAX_LENGTH = 10000;
const SOFT_LIMIT = 1000;

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "PRAYER", label: CATEGORY_LABELS.PRAYER },
  { value: "DEVOTIONAL", label: CATEGORY_LABELS.DEVOTIONAL },
  { value: "MINISTRY", label: CATEGORY_LABELS.MINISTRY },
  { value: "TESTIMONY", label: CATEGORY_LABELS.TESTIMONY },
];

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "MEMBERS", label: "멤버 공개" },
  { value: "PUBLIC", label: "전체 공개" },
  { value: "FOLLOWERS", label: "팔로워 공개" },
  { value: "PRIVATE", label: "나만 보기" },
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
      toast.show("게시되었습니다.");
      setTimeout(() => {
        setJustPosted(false);
        setExpanded(false);
        router.refresh();
        if (redirectOnSuccess) router.push(redirectOnSuccess);
      }, 1200);
    } else {
      const err = result.error ?? "문제가 발생했습니다. 다시 시도해 주세요.";
      setErrorMessage(err);
      toast.error(err);
    }
  }

  const showToolbar = expanded;
  const showPostButton = trimmed.length > 0 || justPosted;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-theme-border border-b bg-theme-surface shadow-soft transition-[border-color] duration-200">
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
          className="block w-full resize-none rounded-lg border border-theme-border bg-theme-surface-2/80 px-3 py-2.5 text-[15px] leading-7 text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:bg-theme-surface focus:outline-none focus:ring-1 focus:ring-theme-primary transition-[min-height,border-color] duration-300 ease-out min-h-[4.5rem]"
          style={{ minHeight: expanded ? "10rem" : "4.5rem" }}
          aria-label="Compose post"
          aria-invalid={errorMessage != null}
          aria-describedby={errorMessage ? "compose-error" : undefined}
        />

        {showToolbar && (
          <div
            className="mt-3 space-y-3 rounded-lg border border-theme-border bg-theme-surface-2/50 p-3 text-sm"
            role="toolbar"
            aria-label="Post options"
          >
            <div>
              <span className="text-xs font-medium text-theme-muted">공개 범위</span>
              <div className="mt-1 flex flex-wrap gap-3" role="group" aria-label="공개 범위">
                {VISIBILITY_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={visibility === value}
                      onChange={() => setVisibility(value)}
                      className="rounded-full border-theme-border text-theme-text focus:ring-theme-primary"
                      aria-label={`공개 범위: ${label}`}
                    />
                    <span className="text-theme-text">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-theme-muted">카테고리</span>
              <div className="mt-1 flex flex-wrap gap-3" role="group" aria-label="카테고리">
                {CATEGORIES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={value}
                      checked={category === value}
                      onChange={() => setCategory(value)}
                      className="rounded-full border-theme-border text-theme-text focus:ring-theme-primary"
                      aria-label={`카테고리: ${label}`}
                    />
                    <span className="text-theme-text">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="compose-tags" className="text-xs font-medium text-neutral-600">
                태그 (선택, 최대 5개)
              </label>
              <input
                id="compose-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="예: 기도, 일상"
                className="mt-1 block w-full rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-[15px] text-theme-text placeholder:text-theme-muted focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                aria-label="태그, 선택, 최대 5개"
              />
            </div>
          </div>
        )}

        <div
          className={`mt-3 flex flex-wrap items-center gap-2 ${expanded ? "sticky bottom-0 z-10 border-t border-theme-border bg-theme-surface pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" : ""}`}
          role="toolbar"
          aria-label="Post actions"
        >
          {showPostButton && (
            <>
              {showToolbar && !justPosted && (
                <span
                  className={`text-xs ${trimmed.length > SOFT_LIMIT ? "text-theme-accent" : "text-theme-muted"}`}
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
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-theme-primary px-5 py-3 text-[14px] font-medium text-white transition-colors duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:transform-none"
                  aria-label={justPosted ? "게시됨" : pending ? "게시 중" : "나누기"}
                >
                  {justPosted ? "게시됨" : pending ? "게시 중…" : "나누기"}
                </button>
              </div>
            </>
          )}
        </div>
        {errorMessage && (
          <p id="compose-error" className="mt-2 text-[13px] text-theme-danger" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
