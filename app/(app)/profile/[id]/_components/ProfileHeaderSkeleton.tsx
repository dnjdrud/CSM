/**
 * Skeleton matching ProfileHero + ProfileStatsStrip layout.
 * Avatar, name, role badge, affiliation/bio lines, CTA row; then stat cards.
 */
import { TimelineContainer } from "@/components/TimelineContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <>
      <div className="flex gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-5 w-24 rounded-md" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </>
  );
}

export function ProfileLoading() {
  return (
    <TimelineContainer>
      <div className="pt-4 pb-6">
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <ProfileHeaderSkeleton />
      <div className="mt-8 space-y-8 border-t border-gray-200 pt-6">
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    </TimelineContainer>
  );
}
