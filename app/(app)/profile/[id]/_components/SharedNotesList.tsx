"use client";

import type { Note } from "@/lib/domain/types";
import { getNotesIntroForRole } from "@/lib/profile/roleProfileConfig";
import type { UserRole } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  notes: Note[];
  role: UserRole;
  blocked?: boolean;
};

/** Read-only list of shared notes for profile Notes tab. */
export function SharedNotesList({ notes, role, blocked }: Props) {
  const intro = getNotesIntroForRole(role);

  if (blocked) {
    return <p className="mt-4 text-sm text-gray-500">You have blocked this user.</p>;
  }

  if (notes.length === 0) {
    return (
      <>
        <p className="mt-2 text-sm text-gray-500">{intro}</p>
        <div className="mt-4">
          <EmptyState
            title="Nothing here yet"
            description="Shared notes will appear here when they're added."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-gray-500">{intro}</p>
      <ul className="mt-4 space-y-4 list-none p-0" role="list">
        {notes.map((note) => (
          <li key={note.id} className="border-b border-gray-100 pb-4 last:border-b-0">
            {note.title && (
              <h3 className="text-[15px] font-medium text-gray-900">{note.title}</h3>
            )}
            <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap font-sans mt-0.5">
              {note.content}
            </p>
            <time dateTime={note.createdAt} className="text-sm text-gray-500 mt-1 block">
              {formatDate(note.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </>
  );
}
