/** Optional small skeleton row for "load more" state. Tailwind only. */
export function FeedSkeletonRow() {
  return (
    <div className="py-4 px-4 border-b border-gray-100">
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100 animate-pulse" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-full max-w-md rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-full max-w-sm rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
