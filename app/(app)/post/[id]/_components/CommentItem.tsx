"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Comment } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ReportMenu } from "@/components/ReportMenu";
import { useToast } from "@/components/ui/Toast";
import { deleteCommentAction as deleteCommentActionDefault, updateCommentAction as updateCommentActionDefault } from "../actions";

type CommentWithAuthor = Comment & { author: User };
type DeleteCommentAction = (commentId: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;
type UpdateCommentAction = (commentId: string, content: string, postId?: string) => Promise<{ ok: boolean; error?: string }>;

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "now";
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  onDeleted,
  onUpdated,
  isReply,
  onReplyClick,
  deleteCommentAction: deleteCommentActionProp,
  updateCommentAction: updateCommentActionProp,
}: {
  comment: CommentWithAuthor;
  postId: string;
  currentUserId: string | null;
  onDeleted?: (commentId: string) => void;
  onUpdated?: (commentId: string, content: string) => void;
  isReply?: boolean;
  onReplyClick?: (parentId: string) => void;
  deleteCommentAction?: DeleteCommentAction;
  updateCommentAction?: UpdateCommentAction;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAuthor = currentUserId != null && currentUserId === comment.authorId;
  const deleteCommentAction = deleteCommentActionProp ?? deleteCommentActionDefault;
  const updateCommentAction = updateCommentActionProp ?? updateCommentActionDefault;
  const toast = useToast();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    if (pending) return;
    setPending(true);
    const result = await deleteCommentAction(comment.id, postId);
    setPending(false);
    if (result.ok) {
      onDeleted?.(comment.id);
      toast.show("Deleted.");
    } else {
      toast.error();
    }
    setMenuOpen(false);
  }

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed || pending) return;
    setPending(true);
    const result = await updateCommentAction(comment.id, trimmed, postId);
    setPending(false);
    if (result.ok) {
      onUpdated?.(comment.id, trimmed);
      setEditing(false);
      toast.show("Updated.");
    } else {
      toast.error();
    }
    setMenuOpen(false);
  }

  const wrapperClass = isReply
    ? "ml-6 pl-3 border-l-2 border-gray-100 py-2"
    : "py-3";

  return (
    <div className={`flex gap-3 ${wrapperClass}`}>
      <Avatar name={comment.author.name} size="sm" className="shrink-0 mt-0.5" />

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0">
          <Link
            href={`/profile/${comment.author.id}`}
            className="text-[15px] font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            {comment.author.name}
          </Link>
          <Badge variant="subtle" className="text-[11px] px-1 py-0">
            {ROLE_DISPLAY[comment.author.role]}
          </Badge>
          <time dateTime={comment.createdAt} className="text-xs text-neutral-500">
            {relativeTime(comment.createdAt)}
          </time>
        </div>

        {/* Body */}
        {editing ? (
          <div className="mt-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              disabled={pending}
              aria-label="Edit comment"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || !content.trim()}
                className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setContent(comment.content); }}
                disabled={pending}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-[15px] leading-7 text-gray-900 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {/* Footer: Reply + … menu */}
        {currentUserId && !editing && (
          <div className="mt-1.5 flex items-center gap-1">
            {!isReply && onReplyClick && (
              <button
                type="button"
                onClick={() => onReplyClick(comment.id)}
                className="text-xs text-neutral-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded px-1 py-0.5"
                aria-label="Reply to comment"
              >
                Reply
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded p-1 text-neutral-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
                aria-label="Comment actions"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="text-sm leading-none">⋯</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute left-0 top-full z-20 mt-0.5 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  role="menu"
                >
                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setEditing(true); setMenuOpen(false); }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleDelete}
                        disabled={pending}
                        className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {!isAuthor && (
                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <ReportMenu
                        targetType="comment"
                        commentId={comment.id}
                        postId={postId}
                        onReported={() => setMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
