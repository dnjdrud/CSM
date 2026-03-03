"use client";

import { useRouter } from "next/navigation";
import { NoteCard } from "./NoteCard";
import { MeditationNoteCard } from "./MeditationNoteCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Note } from "@/lib/domain/types";
import type { NoteType } from "@/lib/domain/types";

const EMPTY_CONFIG: Record<NoteType, { title: string; description: string; action?: { label: string; href: string } }> = {
  PRAYER: {
    title: "Nothing here yet",
    description: "Your prayers stay here until you choose to share them.",
  },
  GRATITUDE: {
    title: "Nothing here yet",
    description: "A small step. Name one thing you're thankful for.",
  },
  MEDITATION: {
    title: "Nothing here yet",
    description: "Save a verse or reflection when you're ready.",
  },
};

type Props = {
  notes: Note[];
  noteType: NoteType;
  onDeleted?: () => void;
  onUpdated?: () => void;
};

export function NotesList({ notes, noteType, onDeleted, onUpdated }: Props) {
  const router = useRouter();
  const handleDeleted = onDeleted ?? (() => router.refresh());
  const handleUpdated = onUpdated ?? (() => router.refresh());

  if (notes.length === 0) {
    const { title, description, action } = EMPTY_CONFIG[noteType];
    return (
      <EmptyState
        title={title}
        description={description}
        action={action}
      />
    );
  }
  return (
    <ul className="list-none p-0 space-y-0" role="list">
      {notes.map((note) => (
        <li key={note.id} className="border-b border-gray-100 last:border-b-0">
          {note.type === "MEDITATION" ? (
            <MeditationNoteCard note={note} onDeleted={handleDeleted} onUpdated={handleUpdated} />
          ) : (
            <NoteCard note={note} onDeleted={handleDeleted} onUpdated={handleUpdated} />
          )}
        </li>
      ))}
    </ul>
  );
}
