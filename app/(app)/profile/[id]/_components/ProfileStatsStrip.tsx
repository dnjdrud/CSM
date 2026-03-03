import { StatCard } from "@/components/ui/StatCard";

type Props = {
  sharedNotesCount: number;
  postsCount: number;
  testimoniesCount: number;
};

export function ProfileStatsStrip({
  sharedNotesCount,
  postsCount,
  testimoniesCount,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4" aria-label="Profile stats">
      <StatCard variant="plain" label="Notes shared" value={sharedNotesCount} />
      <StatCard variant="plain" label="Testimonies" value={testimoniesCount} />
      <StatCard variant="plain" label="Posts" value={postsCount} />
    </div>
  );
}
