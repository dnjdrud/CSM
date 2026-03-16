/** Placeholder rows matching feed list style. Tailwind only, calm and minimal. */
export function FeedSkeleton() {
  return (
    <ul className="list-none p-0" role="list" aria-busy="true" aria-label="Loading feed">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="py-5 px-4 border-b border-theme-border bg-theme-surface">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <div className="h-4 w-24 rounded bg-theme-surface-2 animate-pulse" />
            <span className="text-theme-border">·</span>
            <div className="h-3 w-20 rounded bg-theme-surface-2 animate-pulse" />
            <span className="text-theme-border">·</span>
            <div className="h-3 w-12 rounded bg-theme-surface-2 animate-pulse" />
          </div>
          <div className="mt-0.5 h-3 w-20 rounded bg-theme-surface-2 animate-pulse uppercase tracking-wide" />
          <div className="mt-3 h-4 w-full max-w-md rounded bg-theme-surface-2 animate-pulse" />
          <div className="mt-2 h-4 w-full max-w-sm rounded bg-theme-surface-2 animate-pulse" />
          <div className="mt-4 flex gap-5">
            <div className="h-4 w-14 rounded bg-theme-surface-2 animate-pulse" />
            <div className="h-4 w-16 rounded bg-theme-surface-2 animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
