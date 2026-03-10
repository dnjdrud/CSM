import { redirect } from "next/navigation";
import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Section, SectionHeader, SectionBody } from "@/components/ui/Section";
import { getCurrentUser, listNotesByType, hasNoteOfTypeToday } from "@/lib/data/repository";
import type { NoteType } from "@/lib/domain/types";
import { NotesTabs } from "./_components/NotesTabs";
import { NoteComposer } from "./_components/NoteComposer";
import { MeditationComposer } from "./_components/MeditationComposer";
import { NotesList } from "./_components/NotesList";
import { DailyPromptCards } from "./_components/DailyPromptCards";

const DEFAULT_TAB: NoteType = "PRAYER";
const VALID_TABS: NoteType[] = ["PRAYER", "GRATITUDE", "MEDITATION"];

function parseTab(tab?: string | null): NoteType {
  const t = (tab ?? "").toUpperCase();
  if (VALID_TABS.includes(t as NoteType)) return t as NoteType;
  return DEFAULT_TAB;
}

export default async function MySpacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; prompt?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/onboarding");

  const params = await searchParams;
  const activeTab = parseTab(params.tab);
  const isDailyPrompt = params.prompt === "daily";

  const [notes, prayerDoneToday, gratitudeDoneToday] = await Promise.all([
    activeTab === "PRAYER"
      ? listNotesByType({ userId: currentUser.id, type: "PRAYER", limit: 100 })
      : activeTab === "GRATITUDE"
        ? listNotesByType({ userId: currentUser.id, type: "GRATITUDE", limit: 100 })
        : activeTab === "MEDITATION"
          ? listNotesByType({ userId: currentUser.id, type: "MEDITATION", limit: 100 })
          : [],
    hasNoteOfTypeToday({ userId: currentUser.id, type: "PRAYER" }),
    hasNoteOfTypeToday({ userId: currentUser.id, type: "GRATITUDE" }),
  ]);

  const dailyPlaceholder =
    isDailyPrompt && activeTab === "PRAYER"
      ? "Who are you praying for today?"
      : isDailyPrompt && activeTab === "GRATITUDE"
        ? "What is one thing you're thankful for today?"
        : undefined;

  return (
    <TimelineContainer>
      <div className="pt-4 pb-2">
        <Link
          href={`/profile/${currentUser.id}`}
          className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Profile
        </Link>
      </div>
      <header className="pb-4">
        <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">My Life</h1>
        <p className="mt-1 text-[14px] text-gray-500">A quiet place for your personal notes.</p>
      </header>
      <DailyPromptCards prayerDoneToday={prayerDoneToday} gratitudeDoneToday={gratitudeDoneToday} />
      <Section className="pt-6" aria-labelledby="notes-heading">
        <SectionHeader
          id="notes-heading"
          title="Notes"
          subtitle="Prayer, gratitude, and reflections."
        />
        <SectionBody>
          <NotesTabs activeTab={activeTab} />
          {activeTab === "MEDITATION" ? (
            <MeditationComposer />
          ) : (
            <NoteComposer type={activeTab} placeholder={dailyPlaceholder} />
          )}
          <NotesList notes={notes} noteType={activeTab} />
        </SectionBody>
      </Section>
    </TimelineContainer>
  );
}
