"use client";

import Link from "next/link";
import type { MySpaceOverview } from "@/lib/data/repository";
import { StatCard } from "@/components/ui/StatCard";
import { Section, SectionHeader, SectionBody } from "@/components/ui/Section";

function formatLastReflection(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Props = {
  overview: MySpaceOverview;
};

export function MySpaceOverviewCards({ overview }: Props) {
  return (
    <Section aria-labelledby="overview-heading">
      <SectionHeader
        id="overview-heading"
        title="Overview"
        subtitle="A quiet overview of your journey."
      />
      <SectionBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatCard label="Active Prayers" value={overview.activePrayers} href="/me" />
          <StatCard label="Answered Prayers" value={overview.answeredPrayers} href="/me" />
          <StatCard label="Gratitude This Week" value={overview.gratitudeThisWeek} href="/me?tab=gratitude" />
          <StatCard label="Last Reflection" value={formatLastReflection(overview.lastReflection)} />
        </div>
      </SectionBody>
    </Section>
  );
}
