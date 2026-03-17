/**
 * Skeleton matching PostCard layout: avatar, author line, meta, content lines, action row.
 * Spacing aligned with PostCard (p-5 sm:p-6).
 */
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function FeedPostSkeleton() {
  return (
    <Card role="presentation" aria-hidden className="pointer-events-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton className="mt-5 h-4 w-full max-w-md rounded-md" />
        <Skeleton className="mt-2 h-4 w-full max-w-sm rounded-md" />
        <Skeleton className="mt-2 h-4 w-full max-w-xs rounded-md" />
        <div className="mt-6 flex gap-4 pt-5">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
