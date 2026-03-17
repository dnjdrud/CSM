import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true" aria-label="Loading search">
      <Skeleton className="h-4 w-28 rounded mb-6" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-4 flex gap-2 flex-wrap">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>
      <div className="mt-6 flex border-b border-theme-border gap-4">
        <Skeleton className="h-10 w-16 rounded-t" />
        <Skeleton className="h-10 w-20 rounded-t" />
        <Skeleton className="h-10 w-14 rounded-t" />
      </div>
      <ul className="list-none p-0 mt-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="flex gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
