"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNoteAction } from "../actions";
import { buildMeditationContent } from "@/lib/me/meditationTemplate";
import { useToast } from "@/components/ui/Toast";

type Props = {
  disabled?: boolean;
};

export function MeditationComposer({ disabled }: Props) {
  const router = useRouter();
  const [scripture, setScripture] = useState("");
  const [observation, setObservation] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const canSubmit =
    observation.trim().length > 0 &&
    reflection.trim().length > 0 &&
    prayer.trim().length > 0 &&
    !pending &&
    !disabled;

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
    const result = await createNoteAction("MEDITATION", content, undefined, undefined);
    setPending(false);
    if (result.ok) {
      setScripture("");
      setObservation("");
      setReflection("");
      setPrayer("");
      router.refresh();
      toast.show("Saved.");
    } else {
      toast.error();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-theme-border bg-theme-surface px-4 py-3">
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
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-theme-primary px-4 py-2 text-[14px] font-semibold text-black hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save reflection"}
        </button>
      </div>
    </form>
  );
}
