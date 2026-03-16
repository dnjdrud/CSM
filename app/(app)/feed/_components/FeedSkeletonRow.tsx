/** Small skeleton row for "load more" state. Uses theme tokens. */
import { Skeleton } from "@/components/ui/Skeleton";

export function FeedSkeletonRow() {
  return (
    <div className="border-b border-theme-border px-4 py-4 sm:px-5">
      <div className="flex gap-3 sm:gap-4">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>
      </div>
    </div>
  );
}
