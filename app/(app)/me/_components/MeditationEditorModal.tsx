"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/domain/types";
import { updateNoteAction } from "../actions";
import { useToast } from "@/components/ui/Toast";
import {
  buildMeditationContent,
  parseMeditationContent,
} from "@/lib/me/meditationTemplate";

type Props = {
  note: Note;
  onClose: () => void;
  onSaved: () => void;
};

export function MeditationEditorModal({ note, onClose, onSaved }: Props) {
  const router = useRouter();
  const [scripture, setScripture] = useState("");
  const [observation, setObservation] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fields = parseMeditationContent(note.content);
    setScripture(fields.scripture);
    setObservation(fields.observation);
    setReflection(fields.reflection);
    setPrayer(fields.prayer);
  }, [note.id, note.content]);

  const canSubmit =
    observation.trim().length > 0 &&
    reflection.trim().length > 0 &&
    prayer.trim().length > 0 &&
    !pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    const content = buildMeditationContent({
      scripture,
      observation: observation.trim(),
      reflection: reflection.trim(),
      prayer: prayer.trim(),
    });
    const result = await updateNoteAction(note.id, {
      content,
      title: undefined,
      tags: note.tags,
    });
    setPending(false);
    if (result.ok) {
      router.refresh();
      toast.show("Updated.");
      onSaved();
    } else {
      toast.error();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meditation-editor-title"
    >
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-theme-border bg-theme-surface">
        <h2 id="meditation-editor-title" className="sr-only">
          Edit reflection
        </h2>
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="A passage you are reflecting on…"
            rows={2}
            className="block w-full resize-none rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary mb-3"
            disabled={pending}
          />
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="What stands out?"
            rows={2}
            className="block w-full resize-none rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary mb-3"
            disabled={pending}
            required
          />
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What does this reveal or challenge?"
            rows={2}
            className="block w-full resize-none rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary mb-3"
            disabled={pending}
            required
          />
          <textarea
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            placeholder="A prayer in response…"
            rows={2}
            className="block w-full resize-none rounded-md border border-theme-border bg-theme-surface-2 px-3 py-2 text-[14px] text-theme-text placeholder:text-theme-subtle focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary mb-3"
            disabled={pending}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-theme-border px-4 py-2 text-[14px] font-medium text-theme-text hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-theme-primary px-4 py-2 text-[14px] font-semibold text-black hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
