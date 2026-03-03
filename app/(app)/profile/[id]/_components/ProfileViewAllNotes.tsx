"use client";

import { useState } from "react";
import type { Note } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  notes: Note[];
  profileId: string;
  blocked?: boolean;
  /** Override empty state copy (e.g. for dedicated /notes route). */
  emptyTitle?: string;
  emptyDescription?: string;
};

/** Expanded list of shared notes with "Load more" (30 per page). */
export function ProfileViewAllNotes({ notes, profileId, blocked, emptyTitle, emptyDescription }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = notes.length > visibleCount;
  const visible = notes.slice(0, visibleCount);

  if (blocked) {
    return <p className="text-[15px] text-neutral-500">You have blocked this user.</p>;
  }
  if (notes.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "Nothing here yet"}
        description={emptyDescription ?? "Shared notes will appear here when they're added."}
      />
    );
  }

  return (
    <>
      <ul className="list-none p-0 space-y-4" role="list">
        {visible.map((note) => (
          <li key={note.id}>
            <article className="rounded-xl border border-gray-200 bg-gray-50/30 px-4 py-3">
              {note.title && (
                <h3 className="text-[14px] font-medium text-gray-900">{note.title}</h3>
              )}
              <p className="text-[15px] text-gray-800 leading-7 whitespace-pre-wrap font-sans mt-0.5">
                {note.content}
              </p>
              <time dateTime={note.createdAt} className="text-[12px] text-neutral-500 mt-2 block">
                {formatDate(note.createdAt)}
              </time>
            </article>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
