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
    if (res.ok) {
      onUpdated();
      toast.show("Shared.");
    } else {
      toast.error();
    }
  }

  async function handleSaveAnswerNote() {
    setAnswerSaving(true);
    const res = await updatePrayerAnswerAction(note.id, answerDraft);
    setAnswerSaving(false);
    if (res.ok) {
      setAnswerModalOpen(false);
      onUpdated();
      toast.show("Saved.");
    } else {
      toast.error();
    }
  }

  function openAnswerModal() {
    setAnswerDraft(note.answerNote ?? "");
    setAnswerModalOpen(true);
  }

  async function handleShareTestimony() {
    if (sharedAsTestimony || testimonyPending) return;
    setTestimonyPending(true);
    const { publishTestimonyAction } = await import("../actions");
    const res = await publishTestimonyAction(note.id);
    setTestimonyPending(false);
    if (res.ok) {
      onUpdated();
      toast.show("Shared.");
    } else {
      toast.error();
    }
  }

  return (
    <>
      <Card role="article" className="border-gray-100 bg-gray-50/30">
        <CardContent className="hover:bg-gray-50/50 transition-colors">
        {note.type === "GRATITUDE" && (
          <Badge variant="muted" className="mb-1.5 inline-block">Gratitude</Badge>
        )}
        {note.title && (
          <h3 className="text-[15px] font-medium text-gray-900 mb-0.5">{note.title}</h3>
        )}
        <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
          {note.content}
        </p>
        {note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-[12px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {showAnswerSection && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[12px] font-medium text-gray-600 mb-1.5">Answer</p>
            {note.answerNote ? (
              <>
                <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap mb-1.5">
                  {note.answerNote}
                </p>
                <button
                  type="button"
                  onClick={openAnswerModal}
                  className="text-[13px] text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openAnswerModal}
                className="text-[13px] font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
              >
                Add answer note
              </button>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <time dateTime={note.createdAt} className="text-[12px] text-gray-500">
            {formatDate(note.createdAt)}
          </time>
          <div className="flex flex-wrap items-center gap-2">
            {note.type === "PRAYER" && (
              <>
                {sharedAsTestimony ? (
                  <>
                    <span className="text-[13px] text-gray-500">Shared as testimony</span>
                    <Link
                      href={`/post/${note.publishedPostId}`}
                      className="text-[13px] font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
                    >
                      View post
                    </Link>
                  </>
                ) : canShareTestimony ? (
                  <>
                    <p className="text-[12px] text-gray-500 w-full">
                      Share this answered prayer with the community as a testimony.
                    </p>
                    <button
                      type="button"
                      onClick={handleShareTestimony}
                      disabled={testimonyPending}
                      className="text-[13px] font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testimonyPending ? "Sharing…" : "Share as testimony"}
                    </button>
                  </>
                ) : isPublished ? (
                  <>
                    <span className="text-[13px] text-gray-500">Published</span>
                    <Link
                      href={`/post/${note.publishedPostId}`}
                      className="text-[13px] font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
                    >
                      View post
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-gray-500 w-full">This will create a post in the community feed.</p>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishPending}
                      className="text-[13px] font-medium text-gray-800 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                  if (res.ok) {
                    onUpdated();
                    toast.show("Updated.");
                  } else {
                    toast.error();
                  }
                }}
                className="rounded border-gray-300 text-gray-800 focus:ring-gray-700"
              />
              <span className="text-[13px] text-gray-600">Show on my profile</span>
            </label>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="text-[13px] text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this note?")) return;
                const { deleteNoteAction } = await import("../actions");
                const res = await deleteNoteAction(note.id);
                if (res.ok) {
                  onDeleted();
                  toast.show("Deleted.");
                } else {
                  toast.error();
                }
              }}
              className="text-[13px] text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 rounded"
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
          onSaved={() => {
            setEditorOpen(false);
            onUpdated();
          }}
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
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="answer-note-title" className="text-[15px] font-medium text-gray-900 mb-2">
              Answer
            </h2>
            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder="How was this prayer answered?"
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
            <p className="text-[12px] text-gray-500 mt-1.5 mb-3">
              Remembering answered prayers builds faith.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !answerSaving && setAnswerModalOpen(false)}
                className="px-3 py-1.5 text-[13px] text-gray-600 hover:text-gray-900 rounded border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnswerNote}
                disabled={answerSaving}
                className="px-3 py-1.5 text-[13px] font-medium text-white bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
