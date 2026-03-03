/**
 * Skeleton matching PostCard layout: avatar, author line, meta, content lines, action row.
 * Used in feed/loading.tsx and FeedInfiniteList when loading next page.
 */
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function FeedPostSkeleton() {
  return (
    <Card role="presentation" aria-hidden>
      <CardContent>
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="mt-1 h-3 w-12" />
          </div>
        </div>
        <Skeleton className="mt-2 h-3 w-20" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        <Skeleton className="mt-2 h-4 w-full max-w-xs" />
        <div className="mt-4 flex gap-6 border-t border-gray-100 pt-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
