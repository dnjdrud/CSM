/**
 * Skeleton matching notifications list layout. Uses Skeleton UI primitive.
 */
import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true" aria-label="Loading notifications">
      <Skeleton className="mb-6 h-4 w-28 rounded" />
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <ul className="list-none p-0 space-y-0" role="list">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="py-3 px-3 border-b border-gray-100 last:border-b-0">
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
