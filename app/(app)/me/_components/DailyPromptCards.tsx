"use client";

import Link from "next/link";
import { Section, SectionHeader, SectionBody } from "@/components/ui/Section";

const PRAYER_PROMPT = "Who are you praying for today?";
const GRATITUDE_PROMPT = "What is one thing you're thankful for today?";

type Props = {
  prayerDoneToday: boolean;
  gratitudeDoneToday: boolean;
};

export function DailyPromptCards({ prayerDoneToday, gratitudeDoneToday }: Props) {
  return (
    <Section aria-labelledby="today-heading">
      <SectionHeader
        id="today-heading"
        title="Today"
        subtitle="A small rhythm for today."
      />
      <SectionBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today</p>
            {prayerDoneToday ? (
              <p className="mt-2 text-[15px] text-neutral-500">Done for today</p>
            ) : (
              <>
                <p className="mt-2 text-[15px] leading-7 text-gray-800">{PRAYER_PROMPT}</p>
                <Link
                  href="/me?tab=prayer&prompt=daily#notes-heading"
                  className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-300 bg-transparent px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-80"
                >
                  Add a prayer note
                </Link>
              </>
            )}
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today</p>
            {gratitudeDoneToday ? (
              <p className="mt-2 text-[15px] text-neutral-500">Done for today</p>
            ) : (
              <>
                <p className="mt-2 text-[15px] leading-7 text-gray-800">{GRATITUDE_PROMPT}</p>
                <Link
                  href="/me?tab=gratitude&prompt=daily#notes-heading"
                  className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-300 bg-transparent px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-80"
                >
                  Add a gratitude note
                </Link>
              </>
            )}
          </div>
        </div>
      </SectionBody>
    </Section>
  );
}
