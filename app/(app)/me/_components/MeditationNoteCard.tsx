"use client";

import { useState } from "react";
import type { Note } from "@/lib/domain/types";
import { useToast } from "@/components/ui/Toast";
import { getMeditationSections } from "@/lib/me/meditationTemplate";
import { MeditationEditorModal } from "./MeditationEditorModal";

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

export function MeditationNoteCard({ note, onDeleted, onUpdated }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toast = useToast();

  const sections = getMeditationSections(note.content);

  function toggleSection(i: number) {
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <>
      <article className="px-4 py-4 hover:bg-gray-50/50 transition-colors">
        <span className="inline-block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          Meditation
        </span>
        {sections.length === 0 ? (
          <p className="text-[15px] text-gray-600 font-sans italic">No sections.</p>
        ) : (
          <ul className="list-none p-0 space-y-1">
            {sections.map((section, i) => {
              const isOpen = expanded[i] ?? false;
              return (
                <li key={i} className="border border-gray-100 rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(i)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-inset"
                  >
                    <span className="text-[13px] font-medium text-gray-700">
                      {section.title}
                    </span>
                    <span className="text-gray-400 shrink-0" aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-0">
                      <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                        {section.body}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between">
          <time dateTime={note.createdAt} className="text-[12px] text-gray-500">
            {formatDate(note.createdAt)}
          </time>
          <div className="flex flex-wrap items-center gap-2">
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
      </article>
      {editorOpen && (
        <MeditationEditorModal
          note={note}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
