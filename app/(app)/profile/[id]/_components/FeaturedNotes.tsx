import type { Note } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";

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
};

/** Latest 3 shared notes; journal-style cards (softer border, smaller meta). */
export function FeaturedNotes({ notes, profileId, blocked }: Props) {
  if (blocked) {
    return <p className="text-[15px] text-neutral-500">You have blocked this user.</p>;
  }
  if (notes.length === 0) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Shared notes will appear here when they're added."
      />
    );
  }
  return (
    <ul className="list-none p-0 space-y-3" role="list">
      {notes.slice(0, 3).map((note) => (
        <li key={note.id}>
          <article className="rounded-xl border border-gray-200 bg-gray-50/30 px-4 py-3">
            {note.title && (
              <h3 className="text-[14px] font-medium text-gray-900">{note.title}</h3>
            )}
            <p className="text-[15px] text-gray-800 leading-7 whitespace-pre-wrap font-sans mt-0.5 line-clamp-3">
              {note.content}
            </p>
            <time dateTime={note.createdAt} className="text-[12px] text-neutral-500 mt-2 block">
              {formatDate(note.createdAt)}
            </time>
          </article>
        </li>
      ))}
    </ul>
  );
}
