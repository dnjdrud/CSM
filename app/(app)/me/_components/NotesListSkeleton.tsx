/**
 * Skeleton matching Notes list layout: tab bar + note cards (avatar/content/meta).
 * Used in me/loading.tsx.
 */
import { TimelineContainer } from "@/components/TimelineContainer";
import { Skeleton } from "@/components/ui/Skeleton";

export function NotesListSkeleton() {
  return (
    <ul className="list-none p-0 space-y-0" role="list" aria-busy="true" aria-label="Loading notes">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="border-b border-gray-100 last:border-b-0">
          <div className="px-4 py-4">
            <Skeleton className="h-4 w-20 rounded-md mb-2" />
            <Skeleton className="h-4 w-full max-w-md mb-1" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MySpaceLoading() {
  return (
    <TimelineContainer>
      <div className="pt-4 pb-2">
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <div className="pt-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 max-w-xs" />
      </div>
      <div className="mt-6 flex border-b border-theme-border gap-4">
        <Skeleton className="h-10 w-16 rounded-t" />
        <Skeleton className="h-10 w-20 rounded-t" />
        <Skeleton className="h-10 w-24 rounded-t" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-16 w-full rounded-lg mb-3" />
        <NotesListSkeleton />
      </div>
    </TimelineContainer>
  );
}
