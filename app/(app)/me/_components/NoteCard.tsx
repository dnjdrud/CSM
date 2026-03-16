"use client";

import { useState } from "react";
import Link from "next/link";
import type { Note } from "@/lib/domain/types";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { NoteEditorModal } from "./NoteEditorModal";
import { updatePrayerAnswerAction } from "../actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  note: Note;
  onDeleted: () => void;
  onUpdated: () => void;
};

const linkBtn = "text-[13px] font-medium text-theme-text hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded transition-colors";
const ghostBtn = "text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded transition-colors";

export function NoteCard({ note, onDeleted, onUpdated }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishPending, setPublishPending] = useState(false);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerDraft, setAnswerDraft] = useState(note.answerNote ?? "");
  const [answerSaving, setAnswerSaving] = useState(false);
  const [testimonyPending, setTestimonyPending] = useState(false);
  const toast = useToast();

  const isPublished = Boolean(note.publishedPostId);
  const showAnswerSection = note.type === "PRAYER" && note.status === "ANSWERED";
  const canShareTestimony = showAnswerSection && note.answerNote && !isPublished;
  const sharedAsTestimony = showAnswerSection && note.answerNote && isPublished;

  async function handlePublish() {
    if (isPublished || publishPending) return;
    setPublishPending(true);
    const { publishNoteAction } = await import("../actions");
    const res = await publishNoteAction(note.id);
    setPublishPending(false);
    if (res.ok) { onUpdated(); toast.show("Shared."); } else { toast.error(); }
  }

  async function handleSaveAnswerNote() {
    setAnswerSaving(true);
    const res = await updatePrayerAnswerAction(note.id, answerDraft);
    setAnswerSaving(false);
    if (res.ok) { setAnswerModalOpen(false); onUpdated(); toast.show("Saved."); } else { toast.error(); }
  }

  function openAnswerModal() { setAnswerDraft(note.answerNote ?? ""); setAnswerModalOpen(true); }

  async function handleShareTestimony() {
    if (sharedAsTestimony || testimonyPending) return;
    setTestimonyPending(true);
    const { publishTestimonyAction } = await import("../actions");
    const res = await publishTestimonyAction(note.id);
    setTestimonyPending(false);
    if (res.ok) { onUpdated(); toast.show("Shared."); } else { toast.error(); }
  }

  return (
    <>
      <Card role="article">
        <CardContent>
        {note.type === "GRATITUDE" && (
          <Badge variant="muted" className="mb-1.5 inline-block">Gratitude</Badge>
        )}
        {note.title && (
          <h3 className="text-[15px] font-medium text-theme-text mb-0.5">{note.title}</h3>
        )}
        <p className="text-[15px] text-theme-text-2 leading-relaxed whitespace-pre-wrap font-sans">
          {note.content}
        </p>
        {note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0">
            {note.tags.map((tag) => (
              <span key={tag} className="text-[12px] text-theme-muted bg-theme-surface-2 px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {showAnswerSection && (
          <div className="mt-3 pt-3 border-t border-theme-border">
            <p className="text-[12px] font-medium text-theme-muted mb-1.5">Answer</p>
            {note.answerNote ? (
              <>
                <p className="text-[14px] text-theme-text-2 leading-relaxed whitespace-pre-wrap mb-1.5">
                  {note.answerNote}
                </p>
                <button type="button" onClick={openAnswerModal} className={ghostBtn}>Edit</button>
              </>
            ) : (
              <button type="button" onClick={openAnswerModal} className={linkBtn}>Add answer note</button>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <time dateTime={note.createdAt} className="text-[12px] text-theme-muted">
            {formatDate(note.createdAt)}
          </time>
          <div className="flex flex-wrap items-center gap-2">
            {note.type === "PRAYER" && (
              <>
                {sharedAsTestimony ? (
                  <>
                    <span className="text-[13px] text-theme-muted">Shared as testimony</span>
                    <Link href={`/post/${note.publishedPostId}`} className={linkBtn}>View post</Link>
                  </>
                ) : canShareTestimony ? (
                  <>
                    <p className="text-[12px] text-theme-muted w-full">
                      Share this answered prayer with the community as a testimony.
                    </p>
                    <button
                      type="button"
                      onClick={handleShareTestimony}
                      disabled={testimonyPending}
                      className={`${linkBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {testimonyPending ? "Sharing…" : "Share as testimony"}
                    </button>
                  </>
                ) : isPublished ? (
                  <>
                    <span className="text-[13px] text-theme-muted">Published</span>
                    <Link href={`/post/${note.publishedPostId}`} className={linkBtn}>View post</Link>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-theme-muted w-full">This will create a post in the community feed.</p>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishPending}
                      className={`${linkBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {publishPending ? "Publishing…" : "Publish to Community"}
                    </button>
                  </>
                )}
              </>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(note.shareToProfile)}
                onChange={async () => {
                  const { toggleShareToProfileAction } = await import("../actions");
                  const res = await toggleShareToProfileAction(note.id, !note.shareToProfile);
                  if (res.ok) { onUpdated(); toast.show("Updated."); } else { toast.error(); }
                }}
                className="rounded border-theme-border text-theme-primary focus:ring-theme-accent"
              />
              <span className="text-[13px] text-theme-muted">Show on my profile</span>
            </label>
            <button type="button" onClick={() => setEditorOpen(true)} className={ghostBtn}>Edit</button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this note?")) return;
                const { deleteNoteAction } = await import("../actions");
                const res = await deleteNoteAction(note.id);
                if (res.ok) { onDeleted(); toast.show("Deleted."); } else { toast.error(); }
              }}
              className="text-[13px] text-theme-danger hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-danger focus-visible:ring-offset-2 rounded transition-opacity"
            >
              Delete
            </button>
          </div>
        </div>
        </CardContent>
      </Card>
      {editorOpen && (
        <NoteEditorModal
          note={note}
          onClose={() => setEditorOpen(false)}
          onSaved={() => { setEditorOpen(false); onUpdated(); }}
        />
      )}
      {answerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !answerSaving && setAnswerModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="answer-note-title"
        >
          <div
            className="bg-theme-surface rounded-xl shadow-xl max-w-md w-full p-4 border border-theme-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="answer-note-title" className="text-[15px] font-medium text-theme-text mb-2">Answer</h2>
            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder="How was this prayer answered?"
              rows={4}
              className="w-full border border-theme-border rounded-md px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-muted bg-theme-surface-2 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-colors"
            />
            <p className="text-[12px] text-theme-muted mt-1.5 mb-3">Remembering answered prayers builds faith.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !answerSaving && setAnswerModalOpen(false)}
                className="px-3 py-1.5 text-[13px] text-theme-muted hover:text-theme-text rounded border border-theme-border hover:bg-theme-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnswerNote}
                disabled={answerSaving}
                className="px-3 py-1.5 text-[13px] font-medium text-white bg-theme-primary hover:bg-theme-primary-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {answerSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
